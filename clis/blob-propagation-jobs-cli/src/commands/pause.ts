import { Queue } from "bullmq";
import IORedis from "ioredis";

import { env } from "@blobscan/env";

import type { Command } from "../types";

export const pause: Command = async function () {
  const connection = new IORedis(env.REDIS_URI, { maxRetriesPerRequest: null });

  const overallStatsSyncer = new Queue("swarm-worker", {
    connection,
  });

  // console.log(await overallStatsSyncer.isPaused());

  if (await overallStatsSyncer.isPaused()) {
    await overallStatsSyncer.resume();

    console.log("Resuming overall stats syncer");
  } else {
    console.log("here");
    await overallStatsSyncer.pause();

    console.log("Pausing overall stats syncer");
  }

  // await overallStatsSyncer.close().then(async () => {
  //   await connection.quit();
  // });
};
