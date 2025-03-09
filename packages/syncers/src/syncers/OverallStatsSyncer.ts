import { prisma } from "@blobscan/db";
import type { BlockNumberRange } from "@blobscan/db";
import { createModuleLogger } from "@blobscan/logger";

type OverallStatsSyncerConfig = {
  batchSize?: number;
  lowestSlot?: number;
};

const DEFAULT_BATCH_SIZE = 2_000_000;
const DEFAULT_INITIAL_SLOT = 0;

function isUnset<T>(value: T | undefined | null): value is null | undefined {
  return value === undefined || value === null;
}

const logger = createModuleLogger("overall-stats-syncer");

export async function aggregateOverallStats({
  batchSize = DEFAULT_BATCH_SIZE,
  lowestSlot = DEFAULT_INITIAL_SLOT,
}: OverallStatsSyncerConfig) {
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
    lastLowerSyncedSlot !== lowestSlot
  ) {
    logger.debug(
      "Skipping stats aggregation. Chain hasn't been fully indexed yet"
    );

    return;
  }

  const blockRange: BlockNumberRange = {
    from: lastAggregatedBlock ? lastAggregatedBlock + 1 : 0,
    to: Math.min(lastFinalizedBlock, lastIndexedBlockNumber),
  };

  if (blockRange.from >= blockRange.to) {
    logger.debug(
      `Skipping stats aggregation. No new finalized blocks (last aggregated block: ${lastAggregatedBlock})`
    );

    return;
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

    if (batches > 1) {
      const formattedFromBlock = batchBlockRange.from.toLocaleString();
      const formattedToBlock = batchBlockRange.to.toLocaleString();

      logger.debug(
        `(batch ${
          i + 1
        }/${batches}) Data from block ${formattedFromBlock} up to ${formattedToBlock} aggregated successfully`
      );
    }
  }

  logger.info(
    `Data from block ${blockRange.from.toLocaleString()} up to ${blockRange.to.toLocaleString()} aggregated successfully.`
  );
}
