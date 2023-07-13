import { prisma } from "@blobscan/db";

export default async function handler() {
  // const yesterday = dayjs().subtract(1, "day");
  // const yesterdayPeriod: DatePeriod = {
  //   from: yesterday.startOf("day").toISOString(),
  //   to: yesterday.endOf("day").toISOString(),
  // };

  // const [[blobDailyStats], [blockDailyStats], [txDailyStats]] =
  //   await statsAggregator.getAllDailyAggregates(yesterdayPeriod);

  // const upsertPromises = [];

  // if (blobDailyStats) {
  //   upsertPromises.push(
  //     prisma.blobDailyStats.upsert({
  //       create: blobDailyStats,
  //       update: blobDailyStats,
  //       where: { day: yesterdayPeriod.to },
  //     }),
  //   );
  // }

  // if (blockDailyStats) {
  //   upsertPromises.push(
  //     prisma.blockDailyStats.upsert({
  //       create: blockDailyStats,
  //       update: blockDailyStats,
  //       where: { day: yesterdayPeriod.to },
  //     }),
  //   );
  // }

  // if (txDailyStats) {
  //   upsertPromises.push(
  //     prisma.transactionDailyStats.upsert({
  //       create: txDailyStats,
  //       update: txDailyStats,
  //       where: { day: yesterdayPeriod.to },
  //     }),
  //   );
  // }

  prisma.block.bac;
  // await Promise.all(upsertPromises);
}
