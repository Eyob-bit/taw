import { z } from 'zod';
import { AdminRole, SubmissionStatus } from '@taw/shared';

export const botRegisterUserSchema = z.object({
  telegramId: z.union([z.string(), z.number(), z.bigint()]),
  telegramUsername: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  languageCode: z.string().default('am')
});

export const botCreateSubmissionSchema = z.object({
  telegramId: z.union([z.string(), z.number(), z.bigint()]),
  categoryCode: z.string(),
  content: z.string().min(10, 'Submission must be at least 10 characters').max(3000, 'Submission must be at most 3000 characters'),
  language: z.string().default('am'),
  photoFileId: z.string().optional().nullable(),
  photoFileIds: z.array(z.string()).optional().nullable()
});

export const botCreateReportSchema = z.object({
  publicationId: z.string().uuid(),
  reporterTelegramId: z.union([z.string(), z.number(), z.bigint()]).optional().nullable(),
  reason: z.string().min(5),
  details: z.string().optional().nullable()
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const adminApproveSubmissionSchema = z.object({
  note: z.string().optional().nullable(),
  editedPublicContent: z.string().optional().nullable()
});

export const adminRejectSubmissionSchema = z.object({
  reason: z.string().min(3),
  note: z.string().optional().nullable()
});

export const adminUpdateSubmissionSchema = z.object({
  publicContent: z.string().optional(),
  status: z.nativeEnum(SubmissionStatus).optional()
});

export const adminBlockUserSchema = z.object({
  reason: z.string().min(3)
});

export const adminCreateAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.nativeEnum(AdminRole).default(AdminRole.MODERATOR)
});

export const adminUpdateSettingsSchema = z.object({
  channelId: z.string().optional(),
  discussionGroupId: z.string().optional(),
  autoPublishThreshold: z.number().optional(),
  languageDefault: z.string().optional()
});
