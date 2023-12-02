import { getBlobPropagator } from "@blobscan/blob-propagator";
import { prisma } from "@blobscan/db";

import { env } from "./env";

export async function gracefulShutdown() {
  const shutdownOps = [];

  if (env.BLOB_PROPAGATOR_ENABLED) {
    const blobPropagator = await getBlobPropagator();

    shutdownOps.push(blobPropagator.close());
  }

  shutdownOps.push(prisma.$disconnect());

  return Promise.all(shutdownOps);
}
