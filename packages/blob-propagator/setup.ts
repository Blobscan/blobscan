import { Queue } from "bullmq";
import IORedis from "ioredis";
import { afterAll } from "vitest";

import { env } from "@blobscan/env";

import { FINALIZER_WORKER_NAME, STORAGE_WORKER_NAMES } from "./src/constants";

afterAll(async () => {
  const queues = [
    STORAGE_WORKER_NAMES["GOOGLE"],
    STORAGE_WORKER_NAMES["POSTGRES"],
    FINALIZER_WORKER_NAME,
  ].map(
    (queueName) =>
      new Queue(queueName, {
        connection: new IORedis(env.REDIS_URI, { maxRetriesPerRequest: null }),
      })
  );

  let teardownPromise = Promise.all([
    ...queues.map((q) => q.obliterate({ force: true })),
  ]);

  queues.forEach((q) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    teardownPromise = teardownPromise.finally(async () => {
      await q.close();
    });
  });

  await teardownPromise;
});
