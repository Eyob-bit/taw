import prisma from './prisma.js';
import { toBigInt } from '../utils/bigint.js';
import { SubmissionStatus, ModerationActionType } from '@taw/shared';

export async function getPublications({ page = 1, limit = 20, status, search }) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.postText = { contains: search, mode: 'insensitive' };
  }

  const [total, publications] = await Promise.all([
    prisma.publication.count({ where }),
    prisma.publication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        submission: {
          select: {
            id: true,
            submissionNumber: true,
            status: true,
            language: true,
            category: true,
            createdAt: true
          }
        },
        _count: {
          select: { reports: true }
        }
      }
    })
  ]);

  return {
    publications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function createPublicationRecord({
  submissionId,
  channelId,
  messageId,
  discussionGroupId,
  discussionMessageId,
  postText
}) {
  return prisma.$transaction(async (tx) => {
    // Check if already published to prevent duplicates
    const existing = await tx.publication.findUnique({
      where: { submissionId }
    });

    if (existing) {
      return existing;
    }

    const bMessageId = toBigInt(messageId);
    const bDiscussionMsgId = discussionMessageId ? toBigInt(discussionMessageId) : null;

    const publication = await tx.publication.create({
      data: {
        submissionId,
        channelId: channelId.toString(),
        messageId: bMessageId,
        discussionGroupId: discussionGroupId ? discussionGroupId.toString() : null,
        discussionMessageId: bDiscussionMsgId,
        postText,
        status: 'ACTIVE'
      }
    });

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });

    return publication;
  });
}

export async function removePublication({ publicationId, adminId, reason }) {
  return prisma.$transaction(async (tx) => {
    const publication = await tx.publication.findUnique({
      where: { id: publicationId },
      include: { submission: true }
    });

    if (!publication) {
      throw new Error('Publication not found');
    }

    const updatedPublication = await tx.publication.update({
      where: { id: publicationId },
      data: {
        status: 'REMOVED',
        removedAt: new Date(),
        removedReason: reason
      }
    });

    await tx.submission.update({
      where: { id: publication.submissionId },
      data: {
        status: SubmissionStatus.REMOVED
      }
    });

    await tx.moderationAction.create({
      data: {
        submissionId: publication.submissionId,
        adminId,
        actionType: ModerationActionType.REMOVE_PUBLICATION,
        note: reason,
        previousStatus: SubmissionStatus.PUBLISHED,
        newStatus: SubmissionStatus.REMOVED
      }
    });

    await tx.auditLog.create({
      data: {
        adminId,
        action: 'PUBLICATION_REMOVE',
        entityType: 'PUBLICATION',
        entityId: publicationId,
        details: { reason, submissionId: publication.submissionId }
      }
    });

    return updatedPublication;
  });
}
