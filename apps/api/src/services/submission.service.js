import prisma from './prisma.js';
import { toBigInt } from '../utils/bigint.js';
import { evaluateEligibility, SubmissionStatus, CategoryCode } from '@taw/shared';
import { enqueuePublishJob } from '../jobs/publisher.queue.js';
import { uploadFromTelegram, isCloudinaryConfigured } from './cloudinary.service.js';
import { config } from '../config/index.js';

export async function createSubmission({
  telegramId,
  categoryCode,
  content,
  language = 'am',
  hasAttachments = false,
  photoFileId = null,
  photoFileIds = []
}) {
  const bId = toBigInt(telegramId);
  const normalizedPhotoFileIds = [
    ...(Array.isArray(photoFileIds) ? photoFileIds : []),
    ...(photoFileId ? [photoFileId] : [])
  ].filter(Boolean);
  const uniquePhotoFileIds = [...new Set(normalizedPhotoFileIds)];
  const effectiveHasAttachments = hasAttachments || uniquePhotoFileIds.length > 0;

  // 1. Verify user exists and is not blocked
  const user = await prisma.user.findUnique({
    where: { telegramId: bId }
  });

  if (!user) {
    throw new Error('User account not registered. Please start the bot first.');
  }

  if (user.isBlocked) {
    throw new Error(`Your account is restricted: ${user.blockReason || 'Violation of community guidelines'}`);
  }

  // 2. Find Category
  const category = await prisma.category.findUnique({
    where: { code: categoryCode }
  });

  if (!category) {
    throw new Error(`Category ${categoryCode} does not exist`);
  }

  // 3. Content Analysis & Privacy/Eligibility evaluation
  const analysis = evaluateEligibility({
    text: content,
    categoryCode,
    hasAttachments: effectiveHasAttachments
  });

  const initialStatus = analysis.isEligibleForAutoPublish
    ? SubmissionStatus.READY_TO_PUBLISH
    : SubmissionStatus.PENDING_REVIEW;

  // 4. Process photo attachments (upload to Cloudinary if configured, preserving high quality)
  const attachmentRecords = await Promise.all(
    uniquePhotoFileIds.map(async (fileId) => {
      let finalKey = fileId;
      if (isCloudinaryConfigured() && config.bot.token) {
        try {
          const cloudinaryUrl = await uploadFromTelegram({
            botToken: config.bot.token,
            fileId
          });
          if (cloudinaryUrl) {
            finalKey = cloudinaryUrl;
          }
        } catch (uploadErr) {
          console.warn('[Submission] Cloudinary upload failed, falling back to Telegram file ID:', uploadErr.message);
        }
      }
      return {
        fileKey: finalKey,
        mimeType: 'image/jpeg',
        fileSize: 0,
        status: 'ACCEPTED',
        isApprovedForPublic: true
      };
    })
  );

  // 5. Create Submission record (with attachment if photo provided)
  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      categoryId: category.id,
      status: initialStatus,
      originalContent: content, // Stored safely for moderators only
      publicContent: analysis.sanitizedContent, // Redacted version
      language,
      isEligibleForAutoPublish: analysis.isEligibleForAutoPublish,
      eligibilityReasons: analysis.reasons,
      detectedPii: analysis.piiDetections,
      sensitiveKeywords: analysis.sensitiveAllegations,
      userConfirmedAt: new Date(),
      attachments: attachmentRecords.length > 0 ? {
        create: attachmentRecords
      } : undefined
    },
    include: {
      category: {
        select: {
          code: true,
          nameEn: true,
          nameAm: true,
          hashtag: true
        }
      },
      attachments: true
    }
  });

  // 5. If eligible for automatic publication, enqueue publishing job
  if (analysis.isEligibleForAutoPublish) {
    await enqueuePublishJob(submission.id, { delay: 1000 });
  }

  return submission;
}

export async function getUserSubmissions(telegramId) {
  const bId = toBigInt(telegramId);
  const user = await prisma.user.findUnique({ where: { telegramId: bId } });

  if (!user) return [];

  return prisma.submission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      submissionNumber: true,
      status: true,
      publicContent: true, // Only public content exposed to user
      language: true,
      createdAt: true,
      publishedAt: true,
      rejectionReason: true,
      category: {
        select: {
          code: true,
          nameEn: true,
          nameAm: true,
          hashtag: true
        }
      },
      publication: {
        select: {
          channelId: true,
          messageId: true,
          status: true,
          publishedAt: true
        }
      }
    }
  });
}

export async function getAdminSubmissions({
  page = 1,
  limit = 20,
  status,
  categoryId,
  search,
  fromDate,
  toDate
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  if (search) {
    where.OR = [
      { publicContent: { contains: search, mode: 'insensitive' } },
      { originalContent: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [total, submissions] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        attachments: true,
        publication: true,
        moderationActions: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            admin: {
              select: { id: true, fullName: true, email: true }
            }
          }
        },
        user: {
          select: {
            id: true,
            languageCode: true,
            isBlocked: true,
            createdAt: true
          }
        }
      }
    })
  ]);

  return {
    submissions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getSubmissionById(id, { includePrivate = false } = {}) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      category: true,
      attachments: true,
      publication: true,
      moderationActions: {
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, fullName: true, email: true }
          }
        }
      },
      user: {
        select: {
          id: true,
          languageCode: true,
          isBlocked: true,
          createdAt: true
        }
      }
    }
  });

  if (!submission) return null;

  if (!includePrivate) {
    // Redact original content if not authorized moderator
    delete submission.originalContent;
  }

  return submission;
}
