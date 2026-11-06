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
    if (config.redis.url && config.redis.url !== 'redis://localhost:6379') {
      const isTls = config.redis.url.startsWith('rediss://');
      return new Redis(config.redis.url, {
        maxRetriesPerRequest: null,
        connectTimeout: 5000,
        lazyConnect: true,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 1000, 3000)),
        ...(isTls ? { tls: { rejectUnauthorized: false } } : {})
      });
    }

    return new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 1000, 3000))
    });
  } catch (err) {
    console.warn('[Queue] Failed creating Redis client instance:', err.message);
    return null;
  }
}

// Attempt to initialize BullMQ with Redis
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
        console.log(`ℹ️ Redis is offline (${err.message}). Publishing queue running in direct async executor mode.`);
      });
  } else {
    isRedisAvailable = false;
  }
} catch (err) {
  isRedisAvailable = false;
  console.log(`ℹ️ Redis connection error (${err.message}). Publishing queue running in direct async executor mode.`);
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
