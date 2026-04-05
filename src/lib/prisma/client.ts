import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient();
  } catch {
    // If PrismaClient fails to initialize (e.g., no DATABASE_URL),
    // return a proxy that throws descriptive errors at query time
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === 'then' || prop === '$connect' || prop === '$disconnect') {
          return undefined;
        }
        return new Proxy(() => {}, {
          get() {
            return () => {
              throw new Error('DATABASE_URL is not configured.');
            };
          },
          apply() {
            throw new Error('DATABASE_URL is not configured.');
          },
        });
      },
    });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
