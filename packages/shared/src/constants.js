/**
 * Shared Constants for Ethiopian Relationship Awareness Platform
 */

export const SubmissionStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  READY_TO_PUBLISH: 'READY_TO_PUBLISH',
  PUBLISHING: 'PUBLISHING',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
  REMOVED: 'REMOVED'
};

export const AdminRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MODERATOR: 'MODERATOR',
  SUPPORT_ADMIN: 'SUPPORT_ADMIN'
};

export const ReportStatus = {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED'
};

export const AttachmentStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

export const CategoryCode = {
  ARE_WE_DATING: 'ARE_WE_DATING',
  RELATIONSHIP_SAFETY: 'RELATIONSHIP_SAFETY'
};

export const Hashtags = {
  ARE_WE_DATING: '#are_we_dating_the_same_guy',
  RELATIONSHIP_SAFETY: '#relationship_safety'
};

export const SupportedLanguages = {
  EN: 'en',
  AM: 'am'
};

export const ContentLimits = {
  MIN_SUBMISSION_LENGTH: 30,
  MAX_SUBMISSION_LENGTH: 3000,
  MAX_ATTACHMENTS: 3,
  MAX_ATTACHMENT_SIZE_BYTES: 10 * 1024 * 1024 // 10MB
};

export const ModerationActionType = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  EDIT: 'EDIT',
  REQUEST_CHANGES: 'REQUEST_CHANGES',
  REMOVE_PUBLICATION: 'REMOVE_PUBLICATION',
  RESOLVE_REPORT: 'RESOLVE_REPORT',
  DISMISS_REPORT: 'DISMISS_REPORT'
};

