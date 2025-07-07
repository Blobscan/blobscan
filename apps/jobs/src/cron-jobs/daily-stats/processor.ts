import { normalizeDate, toDailyDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import type { DailyStatsJobResult } from "./types";

export default async (): Promise<DailyStatsJobResult> => {
  const lastIndexedBlock = await prisma.block.findLatest();

  if (!lastIndexedBlock) {
    return;
  }
  const targetDate = normalizeDate(lastIndexedBlock.timestamp).subtract(
    1,
    "day"
  );
  const targetDay = toDailyDate(targetDate);

  const rawLastDailyStatsDay = await prisma.dailyStats.findFirst({
    select: { day: true },
    where: { category: null, rollup: null },
    orderBy: { day: "desc" },
  });
  const lastDailyStatsDay = rawLastDailyStatsDay?.day
    ? normalizeDate(rawLastDailyStatsDay.day)
    : undefined;

  if (lastDailyStatsDay && lastDailyStatsDay.isSame(targetDay, "day")) {
    return {
      fromDate: lastDailyStatsDay.utc().toISOString(),
      toDate: targetDay.utc().toISOString(),
      totalAggregationsCreated: 0,
    };
  }

  const [blobDailyStats] = await prisma.dailyStats.aggregate({
    from: lastDailyStatsDay?.add(1, "day"),
    to: targetDay,
  });

  return {
    fromDate: lastDailyStatsDay?.utc().toISOString(),
    toDate: targetDate.utc().toISOString(),
    totalAggregationsCreated: blobDailyStats.length,
  };
};
