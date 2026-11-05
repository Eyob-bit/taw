import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const botApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600,
  message: { success: false, error: 'Rate limit exceeded for bot requests.' },
  standardHeaders: true,
  legacyHeaders: false
});
