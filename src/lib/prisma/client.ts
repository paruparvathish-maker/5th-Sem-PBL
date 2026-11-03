import { PrismaClient } from '@prisma/client';
// No need for a custom adapter; Prisma will use DATABASE_URL (Turso) automatically
// If Turso requires auth, include it in the DATABASE_URL env variable

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // PrismaClient reads the DATABASE_URL env variable (set to Turso URL)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
