import { Queue, Worker } from 'bullmq';
import { executePublishingPipeline } from './publishing.pipeline.js';
import { config } from '../config/index.js';

const QUEUE_NAME = 'submission-publishing-queue';

let publishQueue = null;
let publishWorker = null;
let isRedisAvailable = false;

// Attempt to initialize BullMQ with Redis
try {
  const redisOptions = {
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
    connectTimeout: 2000,
    lazyConnect: true
  };

  publishQueue = new Queue(QUEUE_NAME, {
    connection: redisOptions,
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

  // Test Redis connection
  publishQueue.client.then(async (client) => {
    try {
      await client.ping();
      isRedisAvailable = true;
      console.log('📦 BullMQ Publishing Queue initialized with Redis');

      // Initialize Worker
      publishWorker = new Worker(
        QUEUE_NAME,
        async (job) => {
          console.log(`[BullMQ Worker] Processing publish job ${job.id} for submission ${job.data.submissionId}`);
          return executePublishingPipeline(job.data.submissionId);
        },
        { connection: redisOptions, concurrency: 2 }
      );

      publishWorker.on('completed', (job) => {
        console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
      });

      publishWorker.on('failed', (job, err) => {
        console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
      });
    } catch {
      isRedisAvailable = false;
      console.log('ℹ️ Redis is offline. Publishing queue running in direct async executor mode.');
    }
  }).catch(() => {
    isRedisAvailable = false;
  });
} catch {
  isRedisAvailable = false;
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
