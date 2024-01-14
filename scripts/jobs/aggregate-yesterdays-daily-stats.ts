import dayjs from "@blobscan/dayjs";
import { daily, gracefulShutdown } from "@blobscan/stats-aggregation-cli";

import { monitorJob } from "../../sentry";

async function main() {
  return monitorJob("upsert-daily-stats", async () => {
    const yesterday = dayjs().subtract(1, "day");
    const from = yesterday.startOf("day").toISOString();
    const to = yesterday.endOf("day").toISOString();

    await daily(["-f", from, "-t", to]);
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
  .finally(gracefulShutdown);
