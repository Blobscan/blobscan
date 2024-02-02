import { gracefulShutdown, overall } from "@blobscan/stats-aggregation-cli";

import { monitorJob } from "../../sentry";

async function main() {
  return monitorJob("upsert-overall-stats", async () => {
    await overall(["--to", "finalized"]);
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
