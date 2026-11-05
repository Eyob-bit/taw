import { Router } from 'express';
import { authenticateAdmin, requireRole } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { AdminRole } from '@taw/shared';

import * as adminAuthController from '../controllers/adminAuth.controller.js';
import * as adminDashboardController from '../controllers/adminDashboard.controller.js';
import * as adminSubmissionController from '../controllers/adminSubmission.controller.js';
import * as adminPublicationController from '../controllers/adminPublication.controller.js';
import * as adminReportController from '../controllers/adminReport.controller.js';
import * as adminUserController from '../controllers/adminUser.controller.js';
import * as adminSettingsController from '../controllers/adminSettings.controller.js';
import * as adminManagementController from '../controllers/adminManagement.controller.js';

const router = Router();

// Auth routes
router.post('/auth/login', authLimiter, adminAuthController.login);
router.post('/auth/logout', adminAuthController.logout);
router.get('/auth/me', authenticateAdmin, adminAuthController.me);

// Dashboard routes
router.get('/dashboard/stats', authenticateAdmin, adminDashboardController.getStats);
router.get('/dashboard/activity', authenticateAdmin, adminDashboardController.getActivity);

// Submissions routes
router.get('/submissions', authenticateAdmin, adminSubmissionController.listSubmissions);
router.get('/submissions/:id', authenticateAdmin, adminSubmissionController.getSubmission);
router.get('/attachments/:id/image', authenticateAdmin, adminSubmissionController.getAttachmentImage);
router.post('/submissions/:id/approve', authenticateAdmin, adminSubmissionController.approveSubmission);
router.post('/submissions/:id/reject', authenticateAdmin, adminSubmissionController.rejectSubmission);
router.patch('/submissions/:id', authenticateAdmin, adminSubmissionController.updateSubmission);

// Publications routes
router.get('/publications', authenticateAdmin, adminPublicationController.listPublications);
router.post('/publications/:id/remove', authenticateAdmin, adminPublicationController.removePublication);
router.post('/publications/:id/retry', authenticateAdmin, adminPublicationController.retryPublication);

// Reports routes
router.get('/reports', authenticateAdmin, adminReportController.listReports);
router.post('/reports/:id/resolve', authenticateAdmin, adminReportController.resolveReport);
router.post('/reports/:id/dismiss', authenticateAdmin, adminReportController.dismissReport);

// Users routes
router.get('/users', authenticateAdmin, adminUserController.listUsers);
router.post('/users/:id/block', authenticateAdmin, adminUserController.blockUser);
router.post('/users/:id/unblock', authenticateAdmin, adminUserController.unblockUser);

// Administrators routes (Super Admin only)
router.get('/administrators', authenticateAdmin, requireRole(AdminRole.SUPER_ADMIN), adminManagementController.listAdministrators);
router.post('/administrators', authenticateAdmin, requireRole(AdminRole.SUPER_ADMIN), adminManagementController.createAdministrator);
router.patch('/administrators/:id', authenticateAdmin, requireRole(AdminRole.SUPER_ADMIN), adminManagementController.updateAdministrator);

// Settings routes
router.get('/settings', authenticateAdmin, adminSettingsController.getSettings);
router.patch('/settings', authenticateAdmin, requireRole(AdminRole.SUPER_ADMIN), adminSettingsController.updateSettings);

export default router;
