import prisma from '../services/prisma.js';
import { formatPublicationPost, SubmissionStatus } from '@taw/shared';
import { publishToTelegramChannel } from '../services/telegramPublisher.js';
import { createPublicationRecord } from '../services/publication.service.js';
import { config } from '../config/index.js';

/**
 * Core publication pipeline executor
 * Idempotent, safe, and logs all transitions
 */
export async function executePublishingPipeline(submissionId) {
  // 1. Fetch Submission
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      category: true,
      publication: true,
      attachments: true
    }
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  // 2. Prevent duplicate publishing (Idempotency)
  if (submission.publication || submission.status === SubmissionStatus.PUBLISHED) {
    console.log(`ℹ️ [Publishing Pipeline] Submission #${submission.submissionNumber} is already published. Skipping.`);
    return submission.publication;
  }

  // 3. Status Check
  if (submission.status !== SubmissionStatus.READY_TO_PUBLISH && submission.status !== SubmissionStatus.APPROVED) {
    console.warn(`⚠️ [Publishing Pipeline] Submission #${submission.submissionNumber} is in status ${submission.status}. Not ready for publishing.`);
    return null;
  }

  // 4. Mark status as PUBLISHING
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: SubmissionStatus.PUBLISHING }
  });

  try {
    // 5. Format channel post text
    const postText = formatPublicationPost({
      categoryCode: submission.category.code,
      publicContent: submission.publicContent,
      language: submission.language || 'am',
      publicationNumber: submission.submissionNumber
    });

    // 6. Publish to Telegram Channel (single photo, album, or text-only)
    const photoFileIds = (submission.attachments || []).map(a => a.fileKey).filter(Boolean);
    const publishResult = await publishToTelegramChannel({
      channelId: config.bot.channelId,
      text: postText,
      photos: photoFileIds   // publisher handles single vs. multi (sendMediaGroup)
    });

    // 7. Create Publication record in database transaction
    const publication = await createPublicationRecord({
      submissionId,
      channelId: publishResult.channelId,
      messageId: publishResult.messageId,
      discussionGroupId: config.bot.discussionGroupId || null,
      postText
    });

    console.log(`✅ [Publishing Pipeline] Successfully published submission #${submission.submissionNumber} to channel ${publishResult.channelId} (Message ID: ${publishResult.messageId})`);

    return publication;
  } catch (error) {
    console.error(`❌ [Publishing Pipeline] Failed to publish submission #${submission.submissionNumber}:`, error.message);

    // Update status to FAILED
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.FAILED }
    });

    throw error;
  }
}
