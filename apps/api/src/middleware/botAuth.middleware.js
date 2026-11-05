import { config } from '../config/index.js';

export function authenticateBot(req, res, next) {
  const apiKey = req.headers['x-bot-api-key'];

  if (!apiKey || apiKey !== config.bot.apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing bot API key'
    });
  }

  next();
}
