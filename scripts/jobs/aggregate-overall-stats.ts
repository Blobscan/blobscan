import { prisma } from "@blobscan/db";

import { monitorJob } from "../../sentry";
import { incrementOverallStats } from "../stats-aggregator/overall";

async function main() {
  return monitorJob("upsert-overall-stats", async () => {
    await incrementOverallStats({ targetBlockId: "finalized" });
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
