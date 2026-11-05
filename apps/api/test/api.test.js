import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/services/prisma.js';
import { config } from '../src/config/index.js';
import { SubmissionStatus, CategoryCode, AdminRole } from '@taw/shared';

describe('Relationship Awareness API Test Suite', () => {
  let adminToken = '';
  let testTelegramId = 9876543210123n;
  let testSubmissionId = '';

  beforeAll(async () => {
    // Clean up test data if any
    await prisma.commentReport.deleteMany();
    await prisma.report.deleteMany();
    await prisma.publication.deleteMany();
    await prisma.moderationAction.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.botSession.deleteMany();
    await prisma.blockedUser.deleteMany();
    await prisma.user.deleteMany({ where: { telegramId: testTelegramId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Health and System Checks', () => {
    it('GET /health returns healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('Bot API Security & User Registration', () => {
    it('rejects bot requests without valid x-bot-api-key', async () => {
      const res = await request(app)
        .post('/api/bot/users/register')
        .send({
          telegramId: testTelegramId.toString(),
          firstName: 'Abebe'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('successfully registers user with valid bot API key', async () => {
      const res = await request(app)
        .post('/api/bot/users/register')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          telegramUsername: 'abebe_test',
          firstName: 'Abebe',
          lastName: 'Kebede',
          languageCode: 'am'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.telegramUsername).toBe('abebe_test');
    });
  });

  describe('Submission Creation & Eligibility Pipeline', () => {
    it('rejects submission if text is shorter than minimum length', async () => {
      const res = await request(app)
        .post('/api/bot/submissions')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          categoryCode: CategoryCode.ARE_WE_DATING,
          content: 'Too short'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects submission for invalid category code', async () => {
      const res = await request(app)
        .post('/api/bot/submissions')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          categoryCode: 'NON_EXISTENT_CAT',
          content: 'This is a valid long text describing a scenario that meets the character limits.'
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('automatically marks clean ARE_WE_DATING questions as READY_TO_PUBLISH', async () => {
      const res = await request(app)
        .post('/api/bot/submissions')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          categoryCode: CategoryCode.ARE_WE_DATING,
          content: 'We met in Addis Ababa around Bole. He introduced himself as an architect named Natnael.',
          language: 'am'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubmissionStatus.READY_TO_PUBLISH);
      expect(res.body.data.isEligibleForAutoPublish).toBe(true);
      testSubmissionId = res.body.data.id;
    });

    it('creates submission with attached photos and stores them as attachments', async () => {
      const res = await request(app)
        .post('/api/bot/submissions')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          categoryCode: CategoryCode.ARE_WE_DATING,
          content: 'Does anyone recognize this person? We met around 22 Mazoria.',
          language: 'am',
          photoFileIds: ['telegram_file_id_sample_123']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attachmentsCount).toBe(1);
    });

    it('routes RELATIONSHIP_SAFETY submission to PENDING_REVIEW', async () => {
      const res = await request(app)
        .post('/api/bot/submissions')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          categoryCode: CategoryCode.RELATIONSHIP_SAFETY,
          content: 'I want to share an experience regarding financial dishonesty during our engagement.',
          language: 'am'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubmissionStatus.PENDING_REVIEW);
      expect(res.body.data.isEligibleForAutoPublish).toBe(false);
    });

    it('routes ARE_WE_DATING submission containing phone numbers to PENDING_REVIEW and sanitizes public text', async () => {
      const res = await request(app)
        .post('/api/bot/submissions')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          categoryCode: CategoryCode.ARE_WE_DATING,
          content: 'Is anyone dating a guy using phone 0911234567? He lives around Kazanchis.',
          language: 'am'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubmissionStatus.PENDING_REVIEW);
      expect(res.body.data.isEligibleForAutoPublish).toBe(false);
      expect(res.body.data.publicContent).toContain('[የስልክ ቁጥር ተወግዷል / Phone Removed]');
      expect(res.body.data.publicContent).not.toContain('0911234567');
    });

    it('never exposes originalContent on public bot submissions endpoints', async () => {
      const res = await request(app)
        .get(`/api/bot/submissions/${testSubmissionId}`)
        .set('x-bot-api-key', config.bot.apiKey);

      expect(res.status).toBe(200);
      expect(res.body.data.originalContent).toBeUndefined();
      expect(res.body.data.publicContent).toBeDefined();
    });
  });

  describe('Admin Authentication & RBAC', () => {
    it('rejects invalid admin login credentials', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@ethiopia-awareness.org',
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('successfully logs in super admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@ethiopia-awareness.org',
          password: 'AdminSecurePassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.admin.role).toBe(AdminRole.SUPER_ADMIN);
      adminToken = res.body.data.token;
    });

    it('GET /api/admin/auth/me returns authenticated admin profile', async () => {
      const res = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@ethiopia-awareness.org');
    });

    it('blocks unauthenticated access to admin endpoints', async () => {
      const res = await request(app).get('/api/admin/dashboard/stats');
      expect(res.status).toBe(401);
    });
  });

  describe('Moderation & Status Transitions', () => {
    it('allows moderator to approve a submission and edit sanitized text', async () => {
      // Create a submission that enters PENDING_REVIEW (e.g. RELATIONSHIP_SAFETY)
      const pendingSub = await request(app)
        .post('/api/bot/submissions')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          categoryCode: CategoryCode.RELATIONSHIP_SAFETY,
          content: 'A safety concern to test moderator approval flow that meets minimum length requirements.',
          language: 'am'
        });

      const res = await request(app)
        .post(`/api/admin/submissions/${pendingSub.body.data.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          note: 'Looks safe and constructive',
          editedPublicContent: 'A safety concern to test moderator approval flow with verified safety advice.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubmissionStatus.READY_TO_PUBLISH);
      expect(res.body.data.publicContent).toBe('A safety concern to test moderator approval flow with verified safety advice.');
    });

    it('allows moderator to reject a submission with reason', async () => {
      // Create another submission to reject
      const createRes = await request(app)
        .post('/api/bot/submissions')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          categoryCode: CategoryCode.ARE_WE_DATING,
          content: 'A submission to test rejection flow that exceeds thirty characters in length.'
        });

      const rejectRes = await request(app)
        .post(`/api/admin/submissions/${createRes.body.data.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Violates community respect guidelines'
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe(SubmissionStatus.REJECTED);
      expect(rejectRes.body.data.rejectionReason).toBe('Violates community respect guidelines');
    });
  });

  describe('Blocked Users Enforcement', () => {
    it('blocks abusive users and prevents them from submitting', async () => {
      const user = await prisma.user.findUnique({ where: { telegramId: testTelegramId } });

      // Block user
      const blockRes = await request(app)
        .post(`/api/admin/users/${user.id}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Repeated spam submission'
        });

      expect(blockRes.status).toBe(200);
      expect(blockRes.body.data.isBlocked).toBe(true);

      // Attempt to submit while blocked
      const submitRes = await request(app)
        .post('/api/bot/submissions')
        .set('x-bot-api-key', config.bot.apiKey)
        .send({
          telegramId: testTelegramId.toString(),
          categoryCode: CategoryCode.ARE_WE_DATING,
          content: 'Attempting to submit while blocked should fail with restricted account error.'
        });

      expect(submitRes.status).toBe(500);
      expect(submitRes.body.error).toContain('restricted');

      // Unblock user
      const unblockRes = await request(app)
        .post(`/api/admin/users/${user.id}/unblock`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unblockRes.status).toBe(200);
      expect(unblockRes.body.data.isBlocked).toBe(false);
    });
  });

  describe('Dashboard Analytics & Stats', () => {
    it('returns dashboard statistics including category counts and daily trends', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalSubmissions).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.categoryDistribution)).toBe(true);
      expect(Array.isArray(res.body.data.dailyTrends)).toBe(true);
    });
  });
});
