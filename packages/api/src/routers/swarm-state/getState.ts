import { TRPCError } from "@trpc/server";

import { BeeDebug } from "@blobscan/blob-storage-manager";
import { z } from "@blobscan/zod";

import { env } from "../../env";
import { publicProcedure } from "../../procedures";

const beeDebug = new BeeDebug(env.BEE_DEBUG_ENDPOINT);

export const inputSchema = z.void();

export const outputSchema = z.object({
  batchTtl: z.number().nullable(),
});

export const getState = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async () => {
    const [firstBatch] = await beeDebug.getAllPostageBatch();

    if (!firstBatch?.batchTTL) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No postage batches available.",
      });
    }

    return {
      batchTtl: firstBatch.batchTTL,
    };
  });
