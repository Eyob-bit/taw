/**
 * keepAlive.js
 *
 * Prevents the Render free-tier web service from spinning down due to inactivity
 * by pinging the /health endpoint every 10 minutes.
 *
 * Without this, Render shuts the process down after ~15 minutes of no inbound HTTP
 * traffic. When the process is dead the embedded Telegram bot (long-polling) is also
 * dead, so the bot stops responding. The cold-start penalty on Render free tier is
 * 50+ seconds – users who message the bot during that window get no reply.
 *
 * This job runs only in production (NODE_ENV=production) and only when the
 * API_BASE_URL env-var is set to the live Render URL.
 */

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function startKeepAlive(baseUrl) {
  if (process.env.NODE_ENV !== 'production') {
    return; // only in production
  }

  const pingUrl = `${baseUrl}/health`;

  async function ping() {
    try {
      const { default: https } = await import('https');
      const { default: http } = await import('http');
      const client = pingUrl.startsWith('https') ? https : http;
      await new Promise((resolve, reject) => {
        const req = client.get(pingUrl, { timeout: 15000 }, (res) => {
          res.resume(); // consume response so socket is freed
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('keep-alive ping timed out'));
        });
      });
      console.log(`[keep-alive] Pinged ${pingUrl} – service is awake`);
    } catch (err) {
      console.warn(`[keep-alive] Ping failed: ${err.message}`);
    }
  }

  // Fire immediately so we confirm the URL is reachable at startup, then repeat
  setTimeout(ping, 30_000); // 30 s after boot (let server fully start first)
  setInterval(ping, PING_INTERVAL_MS);

  console.log(`[keep-alive] Scheduled self-ping every ${PING_INTERVAL_MS / 60000} min → ${pingUrl}`);
}

