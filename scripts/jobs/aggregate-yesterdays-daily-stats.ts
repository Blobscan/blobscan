import dayjs from "@blobscan/dayjs";
import { prisma, RawDatePeriod } from "@blobscan/db";

import { monitorJob } from "../../sentry";
import { performDailyStatsOperation } from "../stats-aggregator/daily";

async function main() {
  return monitorJob("upsert-daily-stats", async () => {
    const yesterday = dayjs().subtract(1, "day");
    const yesterdayPeriod: RawDatePeriod = {
      from: yesterday.startOf("day"),
      to: yesterday.endOf("day"),
    };

    await Promise.all([
      performDailyStatsOperation("blob", "populate", yesterdayPeriod),
      performDailyStatsOperation("block", "populate", yesterdayPeriod),
      performDailyStatsOperation("tx", "populate", yesterdayPeriod),
    ]);
  });
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
