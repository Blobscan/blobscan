import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

async function main() {
  const yesterday = dayjs().subtract(1, "day").endOf("date");
  const untilYesterdayPeriod = {
    to: yesterday.toISOString(),
  };

  const [
    blobDailyStatsInserted,
    blockDailyStatsInserted,
    transactionDailyStatsInserted,
  ] = await Promise.all([
    prisma.blobDailyStats.fill(untilYesterdayPeriod),
    prisma.blockDailyStats.fill(untilYesterdayPeriod),
    prisma.transactionDailyStats.fill(untilYesterdayPeriod),
  ]);

  console.log(`Total blob daily stats inserts: ${blobDailyStatsInserted}`);
  console.log(`Total block daily stats inserts: ${blockDailyStatsInserted}`);
  console.log(`Total tx daily stats inserts: ${transactionDailyStatsInserted}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
