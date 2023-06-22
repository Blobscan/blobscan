import dayjs from "@blobscan/dayjs";
import { prisma, statsAggregator } from "@blobscan/db";

async function main() {
  const yesterday = dayjs().subtract(1, "day").endOf("date");

  const [
    { count: blobDailyStatsInserted },
    { count: blockDailyStatsInserted },
    { count: txDailyStatsInserted },
  ] = await statsAggregator.backfillAllDailyAggregates({
    to: yesterday.toISOString(),
  });

  console.log(`Total blob daily stats inserts: ${blobDailyStatsInserted}`);
  console.log(`Total block daily stats inserts: ${blockDailyStatsInserted}`);
  console.log(`Total tx daily stats inserts: ${txDailyStatsInserted}`);
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
