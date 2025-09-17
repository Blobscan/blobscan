import { prisma } from "./prisma";

export function gracefulShutdown() {
  return prisma.$disconnect();
}
