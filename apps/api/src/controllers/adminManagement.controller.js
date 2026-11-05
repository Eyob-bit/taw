import bcrypt from 'bcryptjs';
import prisma from '../services/prisma.js';
import { adminCreateAdminSchema } from '../validators/index.js';

export async function listAdministrators(req, res, next) {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });
    res.status(200).json({ success: true, data: admins });
  } catch (error) {
    next(error);
  }
}

export async function createAdministrator(req, res, next) {
  try {
    const { email, password, fullName, role } = adminCreateAdminSchema.parse(req.body);

    const existing = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Admin with this email already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const created = await prisma.admin.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        role,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'CREATE_ADMIN',
        entityType: 'ADMIN',
        entityId: created.id,
        details: { email: created.email, role: created.role }
      }
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

export async function updateAdministrator(req, res, next) {
  try {
    const { id } = req.params;
    const { role, isActive, fullName } = req.body;

    const updated = await prisma.admin.update({
      where: { id },
      data: {
        role: role || undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
        fullName: fullName || undefined
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'UPDATE_ADMIN',
        entityType: 'ADMIN',
        entityId: id,
        details: { role, isActive, fullName }
      }
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
