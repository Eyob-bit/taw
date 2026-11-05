import * as userService from '../services/user.service.js';
import * as submissionService from '../services/submission.service.js';
import * as reportService from '../services/report.service.js';
import { botRegisterUserSchema, botCreateSubmissionSchema, botCreateReportSchema } from '../validators/index.js';

export async function registerUser(req, res, next) {
  try {
    const validated = botRegisterUserSchema.parse(req.body);
    const user = await userService.registerOrUpdateUser(validated);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function createSubmission(req, res, next) {
  try {
    const validated = botCreateSubmissionSchema.parse(req.body);
    const submission = await submissionService.createSubmission(validated);
    res.status(201).json({
      success: true,
      data: {
        id: submission.id,
        submissionNumber: submission.submissionNumber,
        status: submission.status,
        publicContent: submission.publicContent,
        isEligibleForAutoPublish: submission.isEligibleForAutoPublish,
        eligibilityReasons: submission.eligibilityReasons,
        attachmentsCount: submission.attachments?.length || 0,
        createdAt: submission.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserSubmissions(req, res, next) {
  try {
    const { telegramId } = req.query;
    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'telegramId is required' });
    }
    const submissions = await submissionService.getUserSubmissions(telegramId);
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
}

export async function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;
    // Public/bot view: includePrivate is false so originalContent is never returned
    const submission = await submissionService.getSubmissionById(id, { includePrivate: false });
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
}

export async function createReport(req, res, next) {
  try {
    const validated = botCreateReportSchema.parse(req.body);
    const report = await reportService.createReport(validated);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}
