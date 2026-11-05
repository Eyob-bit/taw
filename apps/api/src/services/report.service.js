import prisma from './prisma.js';
import { toBigInt } from '../utils/bigint.js';
import { ReportStatus } from '@taw/shared';
import { removePublication } from './publication.service.js';

export async function createReport({ publicationId, reporterTelegramId, reason, details }) {
  let reporterUserId = null;

  if (reporterTelegramId) {
    const user = await prisma.user.findUnique({
      where: { telegramId: toBigInt(reporterTelegramId) }
    });
    if (user) reporterUserId = user.id;
  }

  const publication = await prisma.publication.findUnique({
    where: { id: publicationId }
  });

  if (!publication) {
    throw new Error('Publication not found');
  }

  return prisma.report.create({
    data: {
      publicationId,
      reporterUserId,
      reason,
      details,
      status: ReportStatus.PENDING
    }
  });
}

export async function getReports({ page = 1, limit = 20, status }) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        publication: {
          include: {
            submission: {
              select: {
                id: true,
                submissionNumber: true,
                category: true,
                publicContent: true
              }
            }
          }
        }
      }
    })
  ]);

  return {
    reports,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function resolveReport({ reportId, adminId, resolutionNotes, removePost = false }) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.report.findUnique({
      where: { id: reportId },
      include: { publication: true }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (removePost && report.publication && report.publication.status !== 'REMOVED') {
      await removePublication({
        publicationId: report.publicationId,
        adminId,
        reason: `Removed following report resolution: ${resolutionNotes || report.reason}`
      });
    }

    const updated = await tx.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.RESOLVED,
        resolvedByAdminId: adminId,
        resolutionNotes,
        resolvedAt: new Date()
      }
    });

    await tx.auditLog.create({
      data: {
        adminId,
        action: 'REPORT_RESOLVE',
        entityType: 'REPORT',
        entityId: reportId,
        details: { resolutionNotes, removePost }
      }
    });

    return updated;
  });
}

export async function dismissReport({ reportId, adminId, note }) {
  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: ReportStatus.DISMISSED,
      resolvedByAdminId: adminId,
      resolutionNotes: note || 'Report dismissed by moderator',
      resolvedAt: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      adminId,
      action: 'REPORT_DISMISS',
      entityType: 'REPORT',
      entityId: reportId,
      details: { note }
    }
  });

  return updated;
}
