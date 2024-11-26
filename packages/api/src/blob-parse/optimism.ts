import { z } from "zod";

import { prisma } from "@blobscan/db";
import { logger } from "@blobscan/logger";

export const OptimismDecodedDataSchema = z.object({
  timestampSinceL2Genesis: z.number(),
  lastL1OriginNumber: z.number(),
  parentL2BlockHash: z.string(),
  l1OriginBlockHash: z.string(),
  numberOfL2Blocks: z.number(),
  changedByL1Origin: z.number(),
  totalTxs: z.number(),
  contractCreationTxsNumber: z.number(),
  fullL1OriginBlockHash: z.string().optional(),
});

type OptimismDecodedData = z.infer<typeof OptimismDecodedDataSchema>;

export async function parseOptimismDecodedData(
  data: string
): Promise<OptimismDecodedData | null> {
  let json;

  try {
    json = JSON.parse(data);
  } catch (error) {
    return null;
  }

  const decoded = OptimismDecodedDataSchema.safeParse(json);

  if (!decoded.success) {
    return null;
  }

  const hash = await autocompleteBlockHash(decoded.data.l1OriginBlockHash);

  if (hash) {
    decoded.data.fullL1OriginBlockHash = hash;
  } else {
    logger.error(
      `Failed to get full block hash for L1 origin block hash: ${decoded.data.l1OriginBlockHash}`
    );
  }

  return decoded.data;
}

/* Autocomplete a block hash from a truncated version of it.
   @param partialHash - The first bytes of a block hash.
   @returns The block hash, if there is a single ocurrence, or null.
 */
async function autocompleteBlockHash(partialHash: string) {
  const blocks = await prisma.block.findMany({
    where: {
      hash: {
        startsWith: "0x" + partialHash,
      },
    },
    select: {
      hash: true,
    },
  });

  if (blocks[0] === undefined) {
    return null;
  }

  if (blocks.length > 1) {
    logger.error(`Multiple blocks found for hash ${partialHash}`);
  }

  return blocks[0].hash;
}
