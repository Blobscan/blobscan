import type { Redis } from "ioredis";

import { prisma } from "@blobscan/db";
import type { BlockNumberRange, Prisma } from "@blobscan/db";

import { PeriodicUpdater } from "../PeriodicUpdater";
import { log } from "../utils";

const DEFAULT_BATCH_SIZE = 2_000_000;
export class OverallStatsUpdater extends PeriodicUpdater {
  constructor(
    redisUriOrConnection: string | Redis,
    { batchSize }: { batchSize: number } = { batchSize: DEFAULT_BATCH_SIZE }
  ) {
    const name = "overall-stats-syncer";
    super({
      name,
      redisUriOrConnection,
      updaterFn: async () => {
        const { lastAggregatedBlock, lastFinalizedBlock } =
          (await prisma.blockchainSyncState.findUnique({
            select: {
              lastAggregatedBlock: true,
              lastFinalizedBlock: true,
            },
            where: {
              id: 1,
            },
          })) ?? { lastAggregatedBlock: null, lastFinalizedBlock: null };

        if (lastFinalizedBlock === null) {
          log(
            "debug",
            `Skipping stats aggregation. No blocks have been indexed yet`,
            {
              updater: name,
            }
          );

          return;
        }

        const blockRange: BlockNumberRange = {
          from: lastAggregatedBlock ? lastAggregatedBlock + 1 : 0,
          to: lastFinalizedBlock,
        };

        if (blockRange.from >= blockRange.to) {
          log(
            "debug",
            `Skipping stats aggregation. No new finalized blocks (last aggregated block: ${lastAggregatedBlock})`,
            {
              updater: name,
            }
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

            log(
              "debug",
              `(batch ${
                i + 1
              }/${batches}) Data from block ${formattedFromBlock} up to ${formattedToBlock} aggregated successfully`,
              {
                updater: name,
              }
            );
          }
        }

        log(
          "info",
          `Data from block ${blockRange.from.toLocaleString()} up to ${blockRange.to.toLocaleString()} aggregated successfully.`,
          {
            updater: name,
          }
        );
      },
    });
  }
}
