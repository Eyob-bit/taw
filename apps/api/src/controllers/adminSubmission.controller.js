import fs from 'fs';
import path from 'path';
import prisma from '../services/prisma.js';
import { config } from '../config/index.js';
import * as submissionService from '../services/submission.service.js';
import * as moderationService from '../services/moderation.service.js';
import { adminApproveSubmissionSchema, adminRejectSubmissionSchema, adminUpdateSubmissionSchema } from '../validators/index.js';
import { uploadBuffer, isCloudinaryConfigured } from '../services/cloudinary.service.js';

export async function listSubmissions(req, res, next) {
  try {
    const { page, limit, status, categoryId, search, fromDate, toDate } = req.query;
    const result = await submissionService.getAdminSubmissions({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      categoryId,
      search,
      fromDate,
      toDate
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getSubmission(req, res, next) {
  try {
    const { id } = req.params;
    // Authorized admin can view originalContent
    const submission = await submissionService.getSubmissionById(id, { includePrivate: true });
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
}

export async function approveSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const validated = adminApproveSubmissionSchema.parse(req.body);
    const updated = await moderationService.approveSubmission({
      submissionId: id,
      adminId: req.admin.id,
      editedPublicContent: validated.editedPublicContent,
      note: validated.note
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function rejectSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const validated = adminRejectSubmissionSchema.parse(req.body);
    const updated = await moderationService.rejectSubmission({
      submissionId: id,
      adminId: req.admin.id,
      reason: validated.reason,
      note: validated.note
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function updateSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const validated = adminUpdateSubmissionSchema.parse(req.body);

    if (validated.publicContent !== undefined) {
      const updated = await moderationService.editSanitizedText({
        submissionId: id,
        adminId: req.admin.id,
        publicContent: validated.publicContent
      });
      return res.status(200).json({ success: true, data: updated });
    }

    res.status(400).json({ success: false, error: 'No update parameters provided' });
  } catch (error) {
    next(error);
  }
}

export async function getAttachmentImage(req, res, next) {
  try {
    const { id } = req.params;
    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      return res.status(404).json({ success: false, error: 'Attachment not found' });
    }

    const fileKey = attachment.fileKey;

    // 1. If fileKey is already a Cloudinary / HTTP(S) URL, redirect directly
    if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
      return res.redirect(fileKey);
    }

    // 2. Check if file exists locally in cache
    const storageDir = path.resolve(config.storage.localDir || './storage/attachments');
    const localFilePath = path.join(storageDir, `${attachment.id}.jpg`);

    if (fs.existsSync(localFilePath)) {
      res.setHeader('Content-Type', attachment.mimeType || 'image/jpeg');
      return res.sendFile(localFilePath);
    }

    // 3. Fetch from Telegram Bot API using fileKey (file_id)
    const botToken = config.bot.token;
    if (!botToken || botToken.includes('SAMPLE_TOKEN')) {
      return res.status(404).json({ success: false, error: 'Telegram bot not configured to fetch image' });
    }

    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileKey)}`);
    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      return res.status(404).json({ success: false, error: 'Could not fetch file from Telegram', details: fileData });
    }

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
    const imgRes = await fetch(downloadUrl);

    if (!imgRes.ok) {
      return res.status(502).json({ success: false, error: 'Failed downloading file from Telegram' });
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // 4. If Cloudinary is configured, upload on-the-fly, update database record, and redirect
    if (isCloudinaryConfigured()) {
      try {
        const uploadResult = await uploadBuffer(buffer, {
          public_id: `attachment_${attachment.id}`
        });
        if (uploadResult?.secure_url) {
          await prisma.attachment.update({
            where: { id: attachment.id },
            data: { fileKey: uploadResult.secure_url }
          });
          return res.redirect(uploadResult.secure_url);
        }
      } catch (cloudErr) {
        console.warn('[Admin] Cloudinary upload on-the-fly failed:', cloudErr.message);
      }
    }

    // 5. Save to local cache asynchronously
    try {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      fs.writeFileSync(localFilePath, buffer);
    } catch (saveErr) {
      console.warn('Could not cache attachment locally:', saveErr.message);
    }

    res.setHeader('Content-Type', attachment.mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
}
