import type { BlobscanPrismaClient, BlockNumberRange } from "@blobscan/db";

import { BaseSyncer } from "../BaseSyncer";
import type { CommonSyncerConfig } from "../BaseSyncer";

export interface OverallStatsSyncerConfig extends CommonSyncerConfig {
  prisma: BlobscanPrismaClient;
  batchSize?: number;
  lowestSlot?: number;
}

const DEFAULT_BATCH_SIZE = 2_000_000;
const DEFAULT_INITIAL_SLOT = 0;

function isUnset<T>(value: T | undefined | null): value is null | undefined {
  return value === undefined || value === null;
}

export class OverallStatsSyncer extends BaseSyncer {
  constructor({
    cronPattern,
    prisma,
    redisUriOrConnection,
    batchSize = DEFAULT_BATCH_SIZE,
    lowestSlot = DEFAULT_INITIAL_SLOT,
  }: OverallStatsSyncerConfig) {
    const name = "overall-stats";
    super({
      name,
      cronPattern,
      redisUriOrConnection,
      syncerFn: async () => {
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
          this.logger.debug(
            "Skipping stats aggregation. Chain hasn't been fully indexed yet"
          );

          return;
        }

        const blockRange: BlockNumberRange = {
          from: lastAggregatedBlock ? lastAggregatedBlock + 1 : 0,
          to: Math.min(lastFinalizedBlock, lastIndexedBlockNumber),
        };

        if (blockRange.from >= blockRange.to) {
          this.logger.debug(
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

            this.logger.debug(
              `(batch ${
                i + 1
              }/${batches}) Data from block ${formattedFromBlock} up to ${formattedToBlock} aggregated successfully`
            );
          }
        }

        this.logger.info(
          `Data from block ${blockRange.from.toLocaleString()} up to ${blockRange.to.toLocaleString()} aggregated successfully.`
        );
      },
    });
  }
}
