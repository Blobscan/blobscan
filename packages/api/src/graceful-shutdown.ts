import { blobPropagator } from "@blobscan/blob-propagator";
import { prisma } from "@blobscan/db";

export async function gracefulShutdown() {
  const shutdownOps = [];

  if (blobPropagator) {
    shutdownOps.push(blobPropagator.close());
  }

  shutdownOps.push(prisma.$disconnect());

  return Promise.all(shutdownOps);
}
