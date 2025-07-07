import type { BlockNumberRange } from "@blobscan/db";
import { prisma } from "@blobscan/db";

import { isUnset } from "../../utils";
import type { OverallStatsJobResult, OverallStatsJob } from "./types";

const BATCH_SIZE = 2_000_000;

export default async ({
  data: { batchSize = BATCH_SIZE, forkSlot },
}: OverallStatsJob): Promise<OverallStatsJobResult> => {
  const [blockchainSyncState, latestBlock] = await Promise.all([
    prisma.blockchainSyncState.findUnique({
      select: {
        lastLowerSyncedSlot: true,
        lastAggregatedBlock: true,
        lastFinalizedBlock: true,
      },
      where: {
        id: 1,
      },
    }),
    prisma.block.findLatest(),
  ]);
  const { lastAggregatedBlock, lastFinalizedBlock, lastLowerSyncedSlot } =
    blockchainSyncState ?? {};
  const lastIndexedBlockNumber = latestBlock?.number;

  if (
    isUnset(lastIndexedBlockNumber) ||
    isUnset(lastFinalizedBlock) ||
    lastLowerSyncedSlot !== forkSlot
  ) {
    return;
  }

  const blockRange: BlockNumberRange = {
    from: lastAggregatedBlock ? lastAggregatedBlock + 1 : 0,
    to: Math.min(lastFinalizedBlock, lastIndexedBlockNumber),
  };

  if (blockRange.from >= blockRange.to) {
    return {
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
    };
  }

  const { from, to } = blockRange;
  const unprocessedBlocks = to - from + 1;
  const batches = Math.ceil(unprocessedBlocks / batchSize);

  for (let i = 0; i < batches; i++) {
    const batchFrom = from + i * batchSize;
    const batchTo = Math.min(batchFrom + batchSize - 1, to);
    const batchBlockRange: BlockNumberRange = {
      from: batchFrom,
      to: batchTo,
    };

    await prisma.overallStats.aggregate({ blockRange: batchBlockRange });
  }

  return {
    fromBlock: blockRange.from,
    toBlock: blockRange.to,
  };
};
