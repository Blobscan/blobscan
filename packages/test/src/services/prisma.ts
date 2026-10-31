import { createPrismaClient } from "@blobscan/db";

let prisma: ReturnType<typeof createPrismaClient> | undefined;

export const getPrisma = () => {
  if (!prisma) {
    prisma = createPrismaClient({
      log: [],
    });
  }

  return prisma;
};
