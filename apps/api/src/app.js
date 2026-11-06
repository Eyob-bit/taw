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

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes(',')
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : (process.env.CORS_ORIGIN || '*');

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bot-api-key'],
  credentials: true
}));

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
