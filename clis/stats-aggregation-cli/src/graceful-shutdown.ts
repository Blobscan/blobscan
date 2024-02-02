import { prisma } from "@blobscan/db";

export function gracefulShutdown() {
  return prisma.$disconnect();
}
