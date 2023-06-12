import process from "node:process";
import { parentPort } from "node:worker_threads";
import dayjs from "dayjs";

import { client } from "../client";

void (async () => {
  const now = dayjs().startOf("day");

  await client.stats.blob.backfillDailyStats.mutate({
    to: now.toISOString(),
  });

  // console.log(`A total of ${result.count} days were aggregated`);

  // signal to parent that the job is done
  if (parentPort) parentPort.postMessage("done");
  else process.exit(0);
})();
