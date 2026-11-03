import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

const globalForPrisma = globalThis as unknown as { __shekorPrisma?: PrismaClient };

/** Singleton Prisma client (survives Next.js dev hot reloads). */
export const prisma: PrismaClient =
  globalForPrisma.__shekorPrisma ??
  new PrismaClient({ log: process.env.PRISMA_LOG === '1' ? ['query', 'warn', 'error'] : ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.__shekorPrisma = prisma;
