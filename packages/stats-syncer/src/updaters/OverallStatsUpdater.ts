import type { Redis } from "ioredis";

import { prisma } from "@blobscan/db";
import type { BlockNumberRange } from "@blobscan/db";

import { PeriodicUpdater } from "../PeriodicUpdater";
import { log } from "../utils";

export class OverallStatsUpdater extends PeriodicUpdater {
  constructor(redisUriOrConnection: string | Redis) {
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
            `Skipping overall stats aggregation. No blocks have been indexed yet`,
            {
              updater: name,
            }
          );

          return;
        }

        const blockRange: BlockNumberRange = {
          from: lastAggregatedBlock ?? 0,
          to: lastFinalizedBlock,
        };

        if (blockRange.from >= blockRange.to) {
          log(
            "debug",
            `Skipping overall stats aggregation. No new finalized blocks (last aggregated block: ${lastAggregatedBlock})`,
            {
              updater: name,
            }
          );

          return;
        }

        await prisma.$transaction([
          prisma.blockOverallStats.increment(blockRange),
          prisma.transactionOverallStats.increment(blockRange),
          prisma.blobOverallStats.increment(blockRange),
          prisma.blockchainSyncState.upsert({
            create: {
              lastAggregatedBlock: blockRange.to,
            },
            update: {
              lastAggregatedBlock: blockRange.to,
            },
            where: {
              id: 1,
            },
          }),
        ]);

        log(
          "info",
          `Blocks ${blockRange.from} to ${blockRange.to} stats aggregated successfully.`,
          {
            updater: name,
          }
        );
      },
    });
  }
}
