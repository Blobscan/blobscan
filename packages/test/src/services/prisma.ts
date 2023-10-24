import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | undefined;

export const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [],
    });
  }

  return prisma;
};
