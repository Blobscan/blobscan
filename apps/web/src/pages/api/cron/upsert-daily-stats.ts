import dayjs from "@blobscan/dayjs";
import type { DatePeriod } from "@blobscan/db";
import { prisma } from "@blobscan/db";

export default async function handler() {
  const yesterday = dayjs().subtract(1, "day");
  const yesterdayPeriod: DatePeriod = {
    from: yesterday.startOf("day").toISOString(),
    to: yesterday.endOf("day").toISOString(),
  };

  await Promise.all([
    prisma.blobDailyStats.fill(yesterdayPeriod),
    prisma.blockDailyStats.fill(yesterdayPeriod),
    prisma.transactionDailyStats.fill(yesterdayPeriod),
  ]);
}
