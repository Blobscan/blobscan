import { getBlobPropagator } from "@blobscan/blob-propagator";
import { prisma } from "@blobscan/db";

export async function gracefulShutdown({
  blobPropagatorIsEnabled,
}: {
  blobPropagatorIsEnabled: boolean;
}) {
  const shutdownOps = [];

  if (blobPropagatorIsEnabled) {
    const blobPropagator = await getBlobPropagator();

    shutdownOps.push(blobPropagator.close());
  }

  shutdownOps.push(prisma.$disconnect());

  return Promise.all(shutdownOps);
}
