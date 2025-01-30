import { normalizeDate, toDailyDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import { createModuleLogger } from "@blobscan/logger";

import { formatDate } from "../utils";

const logger = createModuleLogger("daily-stats-syncer");

export async function aggregateDailyStats() {
  const lastIndexedBlock = await prisma.block.findLatest();

  if (!lastIndexedBlock) {
    logger.debug("Skipping stats aggregation. No blocks indexed yet");
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

  if (lastDailyStatsDay ? lastDailyStatsDay?.isSame(targetDay, "day") : false) {
    logger.debug(`Skipping stats aggregation. Already up to date`);
    return;
  }

  const res = await prisma.dailyStats.aggregate({
    from: lastDailyStatsDay?.add(1, "day"),
    to: targetDay,
  });

  logger.info(
    `Daily data up to day ${formatDate(
      targetDay
    )} aggregated. ${res} daily stats created successfully.`
  );
}
