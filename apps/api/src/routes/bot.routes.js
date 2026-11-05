import { Router } from 'express';
import { authenticateBot } from '../middleware/botAuth.middleware.js';
import * as botController from '../controllers/bot.controller.js';

const router = Router();

// Apply bot authentication to all bot routes
router.use(authenticateBot);

router.post('/users/register', botController.registerUser);
router.post('/submissions', botController.createSubmission);
router.get('/submissions', botController.getUserSubmissions);
router.get('/submissions/:id', botController.getSubmissionById);
router.post('/reports', botController.createReport);

export default router;
