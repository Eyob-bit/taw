import prisma from './prisma.js';
import { toBigInt } from '../utils/bigint.js';

export async function registerOrUpdateUser({ telegramId, telegramUsername, firstName, lastName, languageCode = 'am' }) {
  const bId = toBigInt(telegramId);

  // Check if user is blocked
  const blocked = await prisma.blockedUser.findUnique({
    where: { telegramId: bId }
  });

  if (blocked) {
    throw new Error(`Your account has been restricted from using this service. Reason: ${blocked.reason}`);
  }

  const user = await prisma.user.upsert({
    where: { telegramId: bId },
    update: {
      telegramUsername: telegramUsername || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      languageCode: languageCode || undefined
    },
    create: {
      telegramId: bId,
      telegramUsername,
      firstName,
      lastName,
      languageCode
    }
  });

  return user;
}

export async function getUserByTelegramId(telegramId) {
  const bId = toBigInt(telegramId);
  return prisma.user.findUnique({
    where: { telegramId: bId }
  });
}

export async function blockUser({ userId, telegramId, reason, adminId }) {
  return prisma.$transaction(async (tx) => {
    let targetUser = null;

    if (userId) {
      targetUser = await tx.user.findUnique({ where: { id: userId } });
    } else if (telegramId) {
      targetUser = await tx.user.findUnique({ where: { telegramId: toBigInt(telegramId) } });
    }

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Update user
    const updated = await tx.user.update({
      where: { id: targetUser.id },
      data: {
        isBlocked: true,
        blockReason: reason
      }
    });

    // Create or update in BlockedUser table
    await tx.blockedUser.upsert({
      where: { telegramId: targetUser.telegramId },
      update: { reason, blockedByAdminId: adminId },
      create: {
        telegramId: targetUser.telegramId,
        reason,
        blockedByAdminId: adminId
      }
    });

    // Record audit log
    await tx.auditLog.create({
      data: {
        adminId,
        action: 'BLOCK_USER',
        entityType: 'USER',
        entityId: targetUser.id,
        details: { reason, telegramId: targetUser.telegramId.toString() }
      }
    });

    return updated;
  });
}

export async function unblockUser({ userId, adminId }) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        isBlocked: false,
        blockReason: null
      }
    });

    await tx.blockedUser.deleteMany({
      where: { telegramId: user.telegramId }
    });

    await tx.auditLog.create({
      data: {
        adminId,
        action: 'UNBLOCK_USER',
        entityType: 'USER',
        entityId: user.id,
        details: { telegramId: user.telegramId.toString() }
      }
    });

    return updated;
  });
}

export async function getUsersList({ page = 1, limit = 20, search, isBlocked }) {
  const skip = (page - 1) * limit;
  const where = {};

  if (typeof isBlocked === 'boolean') {
    where.isBlocked = isBlocked;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { telegramUsername: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        telegramUsername: true,
        languageCode: true,
        isBlocked: true,
        blockReason: true,
        createdAt: true,
        _count: {
          select: { submissions: true }
        }
      }
    })
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}
