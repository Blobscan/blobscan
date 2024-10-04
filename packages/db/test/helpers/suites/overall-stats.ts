import type {
  BlobOverallStats,
  BlockOverallStats,
  TransactionOverallStats,
} from "@prisma/client";
import { beforeEach, describe, it } from "vitest";

import { prisma } from "../../../prisma";
import type { BlockNumberRange } from "../../../prisma/types";
import { indexBlock } from "../stats";

export type OverallStatsModel =
  | "blobOverallStats"
  | "blockOverallStats"
  | "transactionOverallStats";

export type OveralStats =
  | BlobOverallStats
  | BlockOverallStats
  | TransactionOverallStats;

function hasOverallStatsExtensionFns(model: unknown): model is {
  populate: () => unknown;
  increment: (range: BlockNumberRange) => void;
} {
  return (
    typeof model === "object" &&
    model !== null &&
    "populate" in model &&
    "increment" in model
  );
}

export function getOverallStatsPrismaModel(modelName: OverallStatsModel) {
  const model = prisma[modelName];

  if (hasOverallStatsExtensionFns(model)) {
    return model;
  }

  throw new Error(
    `Model ${modelName.toString()} has no overall stats functions`
  );
}

export function runOverallStatsFunctionsTests(
  modelName: OverallStatsModel,
  {
    assertStats,
  }: { assertStats: (blockNumberRange?: BlockNumberRange) => Promise<void> }
) {
  return describe("Overall stats model functions", () => {
    const prismaModel = getOverallStatsPrismaModel(modelName);

    describe("populate()", () => {
      beforeEach(async () => {
        await prismaModel.populate();
      });

      it("should populate stats correctly", async () => {
        await assertStats();
      });

      it("should replace existing stats correctly", async () => {
        await prismaModel.populate();

        await assertStats();
      });
    });

    describe("increment()", () => {
      it("should increment stats for a specific block range correctly", async () => {
        const blockRange: BlockNumberRange = { from: 1000, to: 1001 };

        await prismaModel.increment(blockRange);

        await assertStats(blockRange);
      });

      it("should increment stats after the first time for a specific block range correctly", async () => {
        const firstBlockRange: BlockNumberRange = { from: 1000, to: 1001 };
        const secondBlockRange: BlockNumberRange = { from: 1002, to: 1003 };

        await prismaModel.increment(firstBlockRange);

        await prismaModel.increment(secondBlockRange);

        await assertStats({ from: 1000, to: 1003 });
      });

      it("should ignore reorged blocks when incrementing stats", async () => {
        await prismaModel.increment({ from: 1000, to: 1008 });

        await indexBlock({ indexAsReorged: true });

        await prismaModel.increment({ from: 1009, to: 9999 });

        await assertStats();
      });
    });
  });
}
