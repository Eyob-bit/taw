import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { executePublishingPipeline } from './publishing.pipeline.js';
import { config } from '../config/index.js';

const QUEUE_NAME = 'submission-publishing-queue';

let publishQueue = null;
let publishWorker = null;
let isRedisAvailable = false;

function buildRedisConnection() {
  try {
    // Only attempt Redis connection if a non-localhost REDIS_URL is provided in production,
    // or if REDIS_URL/host is explicitly provided in development.
    const isProd = process.env.NODE_ENV === 'production';
    const redisUrl = config.redis.url;

    if (isProd && (!redisUrl || redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1'))) {
      return null;
    }

    let client = null;
    if (redisUrl && !redisUrl.includes('localhost')) {
      const isTls = redisUrl.startsWith('rediss://');
      client = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        connectTimeout: 4000,
        lazyConnect: true,
        retryStrategy: (times) => (times > 2 ? null : Math.min(times * 1000, 2000)),
        ...(isTls ? { tls: { rejectUnauthorized: false } } : {})
      });
    } else if (!isProd) {
      client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        maxRetriesPerRequest: null,
        connectTimeout: 2000,
        lazyConnect: true,
        retryStrategy: (times) => (times > 2 ? null : Math.min(times * 1000, 2000))
      });
    }

    if (client) {
      // Prevent unhandled error events from crashing the process
      client.on('error', (err) => {
        isRedisAvailable = false;
        // Suppress noisy reconnection errors in logs
      });
    }

    return client;
  } catch (err) {
    return null;
  }
}

// Attempt to initialize BullMQ with Redis safely
try {
  const queueRedis = buildRedisConnection();
  const workerRedis = buildRedisConnection();

  if (queueRedis && workerRedis) {
    queueRedis.connect()
      .then(async () => {
        await queueRedis.ping();
        isRedisAvailable = true;
        console.log('📦 BullMQ Publishing Queue initialized with Redis');

        publishQueue = new Queue(QUEUE_NAME, {
          connection: queueRedis,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 3000
            },
            removeOnComplete: 100,
            removeOnFail: 200
          }
        });

        await workerRedis.connect();
        publishWorker = new Worker(
          QUEUE_NAME,
          async (job) => {
            console.log(`[BullMQ Worker] Processing publish job ${job.id} for submission ${job.data.submissionId}`);
            return executePublishingPipeline(job.data.submissionId);
          },
          { connection: workerRedis, concurrency: 2 }
        );

        publishWorker.on('completed', (job) => {
          console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
        });

        publishWorker.on('failed', (job, err) => {
          console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
        });
      })
      .catch((err) => {
        isRedisAvailable = false;
        console.log(`ℹ️ Redis not available (${err.message}). Publishing queue running in direct async executor mode.`);
      });
  } else {
    isRedisAvailable = false;
    console.log('ℹ️ Running publishing queue in direct async executor mode.');
  }
} catch (err) {
  isRedisAvailable = false;
  console.log(`ℹ️ Publishing queue running in direct async executor mode.`);
}

/**
 * Enqueue a submission for publication
 * If Redis is running, uses BullMQ with retries & exponential backoff
 * If Redis is offline, runs asynchronously in background
 */
export async function enqueuePublishJob(submissionId, { delay = 0 } = {}) {
  if (isRedisAvailable && publishQueue) {
    try {
      const job = await publishQueue.add(
        'publishSubmission',
        { submissionId },
        {
          jobId: `publish_${submissionId}`,
          delay
        }
      );
      return { success: true, jobId: job.id, mode: 'bullmq' };
    } catch (err) {
      console.warn('BullMQ enqueue failed, falling back to direct executor:', err.message);
    }
  }

  // Direct Async Execution Fallback
  setImmediate(async () => {
    try {
      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }
      await executePublishingPipeline(submissionId);
    } catch (err) {
      console.error(`[Async Executor Error] Publishing failed for ${submissionId}:`, err.message);
    }
  });

  return { success: true, mode: 'direct_async' };
}

export default {
  enqueuePublishJob
};
