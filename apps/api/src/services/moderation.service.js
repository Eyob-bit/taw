import prisma from './prisma.js';
import { SubmissionStatus, ModerationActionType } from '@taw/shared';
import { enqueuePublishJob } from '../jobs/publisher.queue.js';

export async function approveSubmission({ submissionId, adminId, editedPublicContent, note }) {
  const updatedSubmission = await prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
      include: { category: true }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.status === SubmissionStatus.PUBLISHED) {
      throw new Error('Submission is already published');
    }

    const previousStatus = submission.status;
    const finalPublicContent = editedPublicContent !== undefined && editedPublicContent !== null
      ? editedPublicContent.trim()
      : submission.publicContent;

    // Update submission
    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.READY_TO_PUBLISH,
        publicContent: finalPublicContent,
        rejectionReason: null
      },
      include: { category: true }
    });

    // Record ModerationAction
    await tx.moderationAction.create({
      data: {
        submissionId,
        adminId,
        actionType: ModerationActionType.APPROVE,
        note: note || 'Approved by moderator',
        previousStatus,
        newStatus: SubmissionStatus.READY_TO_PUBLISH,
        publicContentDiff: editedPublicContent ? `Original public content modified` : null
      }
    });

    // Record AuditLog
    await tx.auditLog.create({
      data: {
        adminId,
        action: 'SUBMISSION_APPROVE',
        entityType: 'SUBMISSION',
        entityId: submissionId,
        details: { previousStatus, newStatus: SubmissionStatus.READY_TO_PUBLISH, note }
      }
    });

    return updated;
  });

  // Enqueue background publish job after transaction commits
  await enqueuePublishJob(submissionId, { delay: 500 });

  return updatedSubmission;
}

export async function rejectSubmission({ submissionId, adminId, reason, note }) {
  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.status === SubmissionStatus.PUBLISHED) {
      throw new Error('Cannot reject an already published submission. Please remove publication instead.');
    }

    const previousStatus = submission.status;

    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.REJECTED,
        rejectionReason: reason
      }
    });

    await tx.moderationAction.create({
      data: {
        submissionId,
        adminId,
        actionType: ModerationActionType.REJECT,
        note: note || reason,
        previousStatus,
        newStatus: SubmissionStatus.REJECTED
      }
    });

    await tx.auditLog.create({
      data: {
        adminId,
        action: 'SUBMISSION_REJECT',
        entityType: 'SUBMISSION',
        entityId: submissionId,
        details: { reason, note, previousStatus }
      }
    });

    return updated;
  });
}

export async function editSanitizedText({ submissionId, adminId, publicContent, note }) {
  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new Error('Submission not found');

    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: { publicContent: publicContent.trim() }
    });

    await tx.moderationAction.create({
      data: {
        submissionId,
        adminId,
        actionType: ModerationActionType.EDIT,
        note: note || 'Moderator updated sanitized text',
        publicContentDiff: `Updated from: "${submission.publicContent?.substring(0, 50)}..."`
      }
    });

    await tx.auditLog.create({
      data: {
        adminId,
        action: 'SUBMISSION_EDIT_TEXT',
        entityType: 'SUBMISSION',
        entityId: submissionId,
        details: { note }
      }
    });

    return updated;
  });
}
