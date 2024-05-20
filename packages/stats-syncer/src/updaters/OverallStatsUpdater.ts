import type { Redis } from "ioredis";

import { prisma } from "@blobscan/db";
import type { BlockNumberRange, Prisma } from "@blobscan/db";

import { PeriodicUpdater } from "../PeriodicUpdater";

export type OverallStatsUpdaterOptions = {
  batchSize?: number;
  lowestSlot?: number;
};

const DEFAULT_BATCH_SIZE = 2_000_000;
const DEFAULT_INITIAL_SLOT = 0;

function isUnset<T>(value: T | undefined | null): value is null | undefined {
  return value === undefined || value === null;
}

export class OverallStatsUpdater extends PeriodicUpdater {
  constructor(
    redisUriOrConnection: string | Redis,
    options: OverallStatsUpdaterOptions = {}
  ) {
    const name = "overall";
    super({
      name,
      redisUriOrConnection,
      updaterFn: async () => {
        const {
          batchSize = DEFAULT_BATCH_SIZE,
          lowestSlot = DEFAULT_INITIAL_SLOT,
        } = options ?? {};

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
        this.logger.debug(
            `Start overall task: lastIndexedBlockNumber:${lastIndexedBlockNumber},lastFinalizedBlock:${lastFinalizedBlock},lastLowerSyncedSlot:${lastLowerSyncedSlot},lowestSlot:${lowestSlot}`
          );
        if (
          isUnset(lastIndexedBlockNumber) ||
          isUnset(lastFinalizedBlock) ||
          lastLowerSyncedSlot !== lowestSlot
        ) {
          this.logger.debug(
            `Skipping stats aggregation. Chain hasn't been fully indexed yet lastIndexedBlockNumber:${lastIndexedBlockNumber},lastFinalizedBlock:${lastFinalizedBlock},lastLowerSyncedSlot:${lastLowerSyncedSlot},lowestSlot:${lowestSlot}`
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
          const newBlockchainSyncState: Partial<Prisma.BlockchainSyncStateGroupByOutputType> =
            {
              lastAggregatedBlock: batchTo,
            };

          await prisma.$transaction([
            prisma.blockOverallStats.increment(batchBlockRange),
            prisma.transactionOverallStats.increment(batchBlockRange),
            prisma.blobOverallStats.increment(batchBlockRange),
            prisma.blockchainSyncState.upsert({
              create: newBlockchainSyncState,
              update: newBlockchainSyncState,
              where: {
                id: 1,
              },
            }),
          ]);

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
