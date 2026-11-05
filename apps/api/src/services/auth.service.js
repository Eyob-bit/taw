import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './prisma.js';
import { config } from '../config/index.js';

export async function loginAdmin(email, password) {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!admin) {
    throw new Error('Invalid email or password');
  }

  if (!admin.isActive) {
    throw new Error('This account has been deactivated. Please contact an administrator.');
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate JWT token
  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt
    }
  };
}

export async function getAdminById(id) {
  return prisma.admin.findUnique({
    where: { id },
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
}
