import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import './utils/bigint.js';

import botRoutes from './routes/bot.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';

const app = express();

// Trust reverse proxy (essential for Render / Cloudflare / Vercel proxy headers)
app.set('trust proxy', 1);

// Security Headers (relaxed cross-origin-resource-policy so admin can view images)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Robust Dynamic CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, bot)
    if (!origin) return callback(null, true);

    const configured = process.env.CORS_ORIGIN;
    if (configured && configured !== '*') {
      const allowedList = configured.split(',').map(s => s.trim().toLowerCase());
      const lowerOrigin = origin.toLowerCase();
      if (allowedList.includes(lowerOrigin) || lowerOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    }

    // Default: reflect the requesting origin to satisfy browser credentials: true policy
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bot-api-key', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing with limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Logging (safe)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// Global rate limiting
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Ethiopian Relationship Awareness API'
  });
});

// Mount Routes
app.use('/api/bot', botRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
