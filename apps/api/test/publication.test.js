import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import prisma from '../src/services/prisma.js';
import { executePublishingPipeline } from '../src/jobs/publishing.pipeline.js';
import { removePublication } from '../src/services/publication.service.js';
import { SubmissionStatus, CategoryCode, AdminRole } from '@taw/shared';

describe('Publishing Pipeline & Telegram Channel Integration Tests', () => {
  let testUser = null;
  let testAdmin = null;
  let testCategory = null;
  let testSubmission = null;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { telegramId: 888999111222n },
      update: {},
      create: {
        telegramId: 888999111222n,
        firstName: 'Teshome',
        languageCode: 'am'
      }
    });

    testAdmin = await prisma.admin.findFirst({
      where: { role: AdminRole.SUPER_ADMIN }
    });

    testCategory = await prisma.category.findUnique({
      where: { code: CategoryCode.ARE_WE_DATING }
    });

    testSubmission = await prisma.submission.create({
      data: {
        userId: testUser.id,
        categoryId: testCategory.id,
        status: SubmissionStatus.READY_TO_PUBLISH,
        originalContent: 'Has anyone seen this person who says he works as a graphic designer in Sarbet?',
        publicContent: 'Has anyone seen this person who says he works as a graphic designer in Sarbet?',
        language: 'am',
        isEligibleForAutoPublish: true
      }
    });
  });

  afterAll(async () => {
    if (testSubmission) {
      await prisma.publication.deleteMany({ where: { submissionId: testSubmission.id } });
      await prisma.submission.deleteMany({ where: { id: testSubmission.id } });
    }
    if (testUser) {
      await prisma.user.deleteMany({ where: { id: testUser.id } });
    }
    await prisma.$disconnect();
  });

  it('successfully publishes a READY_TO_PUBLISH submission through the pipeline', async () => {
    const publication = await executePublishingPipeline(testSubmission.id);

    expect(publication).toBeDefined();
    expect(publication.submissionId).toBe(testSubmission.id);
    expect(publication.status).toBe('ACTIVE');
    expect(publication.postText).toContain('#are_we_dating_the_same_guy');
    expect(publication.postText).toContain('⚠️ ይህ ጥያቄ ብቻ ነው');

    // Verify submission record updated
    const updatedSub = await prisma.submission.findUnique({
      where: { id: testSubmission.id }
    });
    expect(updatedSub.status).toBe(SubmissionStatus.PUBLISHED);
    expect(updatedSub.publishedAt).toBeDefined();
  });

  it('prevents duplicate publication when pipeline is called again (idempotent)', async () => {
    const publicationAgain = await executePublishingPipeline(testSubmission.id);

    expect(publicationAgain).toBeDefined();

    // Verify only ONE publication record exists for this submission
    const count = await prisma.publication.count({
      where: { submissionId: testSubmission.id }
    });
    expect(count).toBe(1);
  });

  it('allows moderator to remove a published post and updates both records', async () => {
    const publication = await prisma.publication.findUnique({
      where: { submissionId: testSubmission.id }
    });

    const removed = await removePublication({
      publicationId: publication.id,
      adminId: testAdmin.id,
      reason: 'Requested removal by submitter'
    });

    expect(removed.status).toBe('REMOVED');
    expect(removed.removedReason).toBe('Requested removal by submitter');

    const subAfterRemoval = await prisma.submission.findUnique({
      where: { id: testSubmission.id }
    });
    expect(subAfterRemoval.status).toBe(SubmissionStatus.REMOVED);
  });
});
