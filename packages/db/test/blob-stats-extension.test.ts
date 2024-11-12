import type { BlobOverallStats } from "@prisma/client";
import { describe, expect } from "vitest";

import { getDateFromISODateTime } from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import { prisma } from "../prisma";
import {
  getElementByAggregableType,
  groupElementsByAggregableType,
  groupElementsByDay,
} from "./helpers/stats";
import { runDailyStatsFunctionsTests } from "./helpers/suites/daily-stats";

describe("Blob Stats Extension", () => {
  runDailyStatsFunctionsTests("blobDailyStats", {
    async assertStats(datePeriod) {
      const allDailyStats = await prisma.blobDailyStats.findMany();
      const expectedBlobsByDay = groupElementsByDay({
        elements: fixtures.getBlobs({ datePeriod }),
        timeFieldName: "block.timestamp",
      });

      for (const [day, expectedDayBlobs] of expectedBlobsByDay.entries()) {
        const expectedBlobsByAggregableType =
          groupElementsByAggregableType(expectedDayBlobs);

        const dayStats = allDailyStats.filter(
          (stats) => stats.day.toISOString() === day
        );

        for (const [
          aggregableType,
          expectedBlobs,
        ] of expectedBlobsByAggregableType.entries()) {
          const stats = getElementByAggregableType(dayStats, aggregableType);
          const formattedDay = getDateFromISODateTime(day);

          expect(
            stats,
            `${aggregableType} daily stats for day ${formattedDay} not created`
          ).toBeDefined();

          if (stats) {
            const expectedStats = calculateStats(expectedBlobs);

            for (const statName_ in expectedStats) {
              const statName = statName_ as keyof typeof expectedStats;

              expect(
                stats[statName],
                `${aggregableType} daily stat "${statName}" for day ${formattedDay} mismatch`
              ).toEqual(expectedStats[statName]);
            }
          }
        }
      }
    },
  });
});

function calculateStats(
  blobs: ReturnType<typeof fixtures.getBlobs>,
  blockNumberRange?: { from: number; to: number }
): Omit<BlobOverallStats, "id" | "category" | "rollup" | "updatedAt"> {
  const totalBlobs = blobs.length;
  const totalUniqueBlobs = new Set(
    blobs
      .filter(({ firstBlockNumber }) =>
        blockNumberRange && firstBlockNumber
          ? firstBlockNumber >= blockNumberRange.from &&
            firstBlockNumber <= blockNumberRange.to
          : true
      )
      .map(({ versionedHash }) => versionedHash)
  ).size;
  const totalBlobSize = blobs.reduce(
    (acc, b) => acc + BigInt(b.size),
    BigInt(0)
  );

  return {
    totalBlobs,
    totalUniqueBlobs,
    totalBlobSize,
  };
}
