import dayjs from "@blobscan/dayjs";
import { DatePeriod, prisma } from "@blobscan/db";

async function main() {
  const yesterday = dayjs().subtract(1, "day");
  const yesterdayPeriod: DatePeriod = {
    from: yesterday.startOf("day").toISOString(),
    to: yesterday.endOf("day").toISOString(),
  };

  const [blobStatsRes, blockStatsRes, txStatsRes] = await Promise.all([
    prisma.blobDailyStats.fill(yesterdayPeriod),
    prisma.blockDailyStats.fill(yesterdayPeriod),
    prisma.transactionDailyStats.fill(yesterdayPeriod),
  ]);

  console.log("=====================================");
  console.log(`Blob stats inserted: ${blobStatsRes}`);
  console.log(`Block stats inserted: ${blockStatsRes}`);
  console.log(`Tx stats inserted: ${txStatsRes}`);
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
