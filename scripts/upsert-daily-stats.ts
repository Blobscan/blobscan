import dayjs from "@blobscan/dayjs";
import { DatePeriod, prisma } from "@blobscan/db";

import { monitorJob } from "../sentry";

async function main() {
  return monitorJob("upsert-daily-stats", async () => {
    const yesterday = dayjs().subtract(1, "day");
    const yesterdayPeriod: DatePeriod = {
      from: yesterday.startOf("day").toISOString(),
      to: yesterday.endOf("day").toISOString(),
    };

    const [blobStatsRes, blockStatsRes, txStatsRes] = await Promise.all([
      prisma.blobDailyStats.populate(yesterdayPeriod),
      prisma.blockDailyStats.populate(yesterdayPeriod),
      prisma.transactionDailyStats.populate(yesterdayPeriod),
    ]);

    console.log("=====================================");
    console.log(
      `Daily stats aggregated for day ${yesterday.format("YYYY-MM-DD")}`
    );
    console.log(`Blob daily stats upserted (rows upserted: ${blobStatsRes})`);
    console.log(`Block daily stats upserted (rows upserted: ${blockStatsRes})`);
    console.log(`Tx daily stats upserted (rows upserted: ${txStatsRes})`);
  });
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
