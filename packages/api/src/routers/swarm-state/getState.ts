import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { BlobStorage } from "@blobscan/db";

const BATCH_LABEL = "blobs2" // TODO: use chain id when we move a per network batch

export const inputSchema = z.void();

export const outputSchema = z.object({
  batchId: z.string(),
  batchTtl: z.number(),
});

export const getState = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { blobStorageManager } }) => {

    const swarmStorage = blobStorageManager.getStorage(BlobStorage.SWARM)

    if (!swarmStorage) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Swarm storage not available."
      });
    }

    const batch = await swarmStorage.getPostageBatch(BATCH_LABEL)

    if (!batch) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No postage batch '${BATCH_LABEL}' available.`,
      });
    }

    return {
      batchId: batch.batchID,
      batchTtl: batch.batchTTL,
    };
  });
