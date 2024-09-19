import type { BlockOverallStats } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { describe, expect } from "vitest";

import { getDateFromISODateTime, toDailyDate } from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import { prisma } from "../prisma";
import { runDailyStatsFunctionsTests } from "./helpers/suites/daily-stats";
import { runOverallStatsFunctionsTests } from "./helpers/suites/overall-stats";

const avgMetrics: (keyof BlockOverallStats)[] = [
  "avgBlobAsCalldataFee",
  "avgBlobFee",
  "avgBlobGasPrice",
  "avgBlobAsCalldataFee",
];

describe("Block Stats Extension", () => {
  runDailyStatsFunctionsTests("blockDailyStats", {
    async assertStats(datePeriod) {
      const allDailyStats = await prisma.blockDailyStats.findMany();
      const expectedBlocks = fixtures.getBlocks({ datePeriod });

      const expectedDayToBlocks = expectedBlocks.reduce(
        (dayToBlocks, block) => {
          const day = toDailyDate(block.timestamp, "startOf").toISOString();

          if (!dayToBlocks.has(day)) {
            dayToBlocks.set(day, []);
          }

          dayToBlocks.get(day)?.push(block);

          return dayToBlocks;
        },
        new Map<string, typeof expectedBlocks>()
      );

      for (const [day, expectedBlocks] of expectedDayToBlocks.entries()) {
        const dayStats = allDailyStats.filter(
          (stats) => stats.day.toISOString() === day
        );

        const formattedDay = getDateFromISODateTime(day);

        expect(dayStats, `Stats for day ${day} not created`).toHaveLength(1);

        const singleDayStats = dayStats[0];

        if (singleDayStats) {
          const expectedStats = calculateStats(expectedBlocks);

          for (const statName_ in expectedStats) {
            const statName = statName_ as keyof typeof expectedStats;
            const isAvg = avgMetrics.includes(statName);

            // Skip these stats as they are not calculated in the daily stats
            if (statName === "totalBlobGasPrice") {
              continue;
            }

            const errorMsg = `Daily stat "${statName}" for day ${formattedDay} mismatch`;

            if (isAvg) {
              expect(singleDayStats[statName], errorMsg).toBeCloseTo(
                expectedStats[statName] as number
              );
            } else {
              expect(singleDayStats[statName], errorMsg).toEqual(
                expectedStats[statName]
              );
            }
          }
        }
      }
    },
  });

  runOverallStatsFunctionsTests("blockOverallStats", {
    async assertStats(blockNumberRange) {
      const allOverallStats = await prisma.blockOverallStats.findMany();
      const expectedBlocks = fixtures.getBlocks({
        blockNumberRange,
      });

      expect(
        allOverallStats,
        "More or less than one overall stats record created"
      ).toHaveLength(1);

      const overallStats = allOverallStats[0];

      if (overallStats) {
        const expectedStats = calculateStats(expectedBlocks, blockNumberRange);

        for (const statName_ in expectedStats) {
          const statName = statName_ as keyof typeof expectedStats;
          const isAvg = avgMetrics.includes(statName);

          const errorMsg = `Overall stat "${statName}" mismatch`;

          if (isAvg) {
            expect(overallStats[statName], errorMsg).toBeCloseTo(
              expectedStats[statName] as number
            );
          } else {
            expect(overallStats[statName], errorMsg).toEqual(
              expectedStats[statName]
            );
          }
        }
      }
    },
  });
});

function calculateStats(
  blocks: ReturnType<typeof fixtures.getBlocks>,
  _?: { from: number; to: number }
): Omit<BlockOverallStats, "id" | "updatedAt"> {
  const totalBlocks = blocks.length;
  const totalBlobGasUsed = blocks.reduce(
    (total, block) => total.add(new Decimal(block.blobGasUsed)),
    new Decimal(0)
  );
  const totalBlobAsCalldataGasUsed = blocks.reduce(
    (total, block) => total.add(new Decimal(block.blobAsCalldataGasUsed)),
    new Decimal(0)
  );
  const totalBlobFee = blocks.reduce(
    (total, block) =>
      total.add(new Decimal(block.blobGasUsed).mul(block.blobGasPrice)),
    new Decimal(0)
  );
  const totalBlobAsCalldataFee = blocks.reduce(
    (total, block) =>
      total.add(
        new Decimal(block.blobAsCalldataGasUsed).mul(block.blobGasPrice)
      ),
    new Decimal(0)
  );
  const totalBlobGasPrice = blocks.reduce(
    (total, block) => total.add(new Decimal(block.blobGasPrice)),
    new Decimal(0)
  );
  const avgBlobGasPrice = totalBlobGasPrice.div(totalBlocks).toNumber();
  const avgBlobFee = totalBlobFee.div(totalBlocks).toNumber();
  const avgBlobAsCalldataFee = totalBlobAsCalldataFee
    .div(totalBlocks)
    .toNumber();

  return {
    avgBlobAsCalldataFee,
    avgBlobFee,
    avgBlobGasPrice,
    totalBlobGasPrice,
    totalBlocks,
    totalBlobGasUsed,
    totalBlobAsCalldataGasUsed,
    totalBlobFee,
    totalBlobAsCalldataFee,
  };
}
