import prisma from './prisma.js';
import { SubmissionStatus, ReportStatus } from '@taw/shared';

export async function getDashboardStats() {
  const [
    totalSubmissions,
    pendingReviews,
    publishedCount,
    rejectedCount,
    openReports,
    activeUsers,
    categoriesWithCount
  ] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.count({ where: { status: SubmissionStatus.PENDING_REVIEW } }),
    prisma.submission.count({ where: { status: SubmissionStatus.PUBLISHED } }),
    prisma.submission.count({ where: { status: SubmissionStatus.REJECTED } }),
    prisma.report.count({ where: { status: ReportStatus.PENDING } }),
    prisma.user.count({ where: { isBlocked: false } }),
    prisma.category.findMany({
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })
  ]);

  // Daily submission trend for last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentSubmissions = await prisma.submission.findMany({
    where: { createdAt: { gte: fourteenDaysAgo } },
    select: { createdAt: true, status: true, categoryId: true }
  });

  // Group by date (YYYY-MM-DD)
  const trendsMap = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    trendsMap[dateStr] = { date: dateStr, count: 0, published: 0 };
  }

  for (const s of recentSubmissions) {
    const dateStr = s.createdAt.toISOString().split('T')[0];
    if (trendsMap[dateStr]) {
      trendsMap[dateStr].count += 1;
      if (s.status === SubmissionStatus.PUBLISHED) {
        trendsMap[dateStr].published += 1;
      }
    }
  }

  const categoryDistribution = categoriesWithCount.map(c => ({
    id: c.id,
    code: c.code,
    nameEn: c.nameEn,
    nameAm: c.nameAm,
    count: c._count.submissions
  }));

  return {
    totalSubmissions,
    pendingReviews,
    publishedCount,
    rejectedCount,
    openReports,
    activeUsers,
    categoryDistribution,
    dailyTrends: Object.values(trendsMap)
  };
}

export async function getRecentActivity(limit = 15) {
  const [auditLogs, moderationActions] = await Promise.all([
    prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, fullName: true, email: true, role: true }
        }
      }
    }),
    prisma.moderationAction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, fullName: true, email: true }
        },
        submission: {
          select: { id: true, submissionNumber: true, category: true }
        }
      }
    })
  ]);

  return {
    auditLogs,
    moderationActions
  };
}
