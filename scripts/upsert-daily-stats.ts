import * as Sentry from "@sentry/node";

import dayjs from "@blobscan/dayjs";
import { DatePeriod, prisma } from "@blobscan/db";

const SENTRY_DSN = process.env.SENTRY_DSN;

function sentry_init() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  }
}

async function main() {
  sentry_init();

  // 🟡 Notify Sentry your job is running:
  const checkInId = Sentry.captureCheckIn({
    monitorSlug: "upsert-daily-stats",
    status: "in_progress",
  });

  try {
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

    // 🟢 Notify Sentry your job has completed successfully:
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "upsert-daily-stats",
      status: "ok",
    });
  } catch (err) {
    // 🔴 Notify Sentry your job has failed:
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "upsert-daily-stats",
      status: "error",
    });

    throw err;
  }
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
