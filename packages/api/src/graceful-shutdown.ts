import { prisma } from "@blobscan/db";

export async function gracefulShutdown() {
  const shutdownOps = [];

  shutdownOps.push(prisma.$disconnect());

  return Promise.all(shutdownOps);
}
