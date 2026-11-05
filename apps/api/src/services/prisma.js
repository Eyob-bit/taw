import { PrismaClient } from '@prisma/client';
import '../utils/bigint.js';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

export default prisma;
