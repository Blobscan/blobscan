import { createOrLoadBlobPropagator } from "@blobscan/blob-propagator";
import { prisma } from "@blobscan/db";

export async function gracefulShutdown() {
  const blobPropagator = await createOrLoadBlobPropagator();

  const shutdownOps = [];

  shutdownOps.push(blobPropagator.close());
  shutdownOps.push(prisma.$disconnect());

  return Promise.all(shutdownOps);
}
