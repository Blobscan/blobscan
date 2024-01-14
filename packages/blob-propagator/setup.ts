import { Queue } from "bullmq";
import type { RedisOptions } from "ioredis";
import { afterAll } from "vitest";

import { blobFileManager } from "./src/blob-file-manager";
import { env } from "./src/env";
import { FINALIZER_WORKER_NAME, STORAGE_WORKER_NAMES } from "./src/utils";

const connection: RedisOptions = {
  host: env.REDIS_QUEUE_HOST,
  port: env.REDIS_QUEUE_PORT,
  password: env.REDIS_QUEUE_PASSWORD,
  username: env.REDIS_QUEUE_USERNAME,
};

afterAll(async () => {
  const queues = [
    STORAGE_WORKER_NAMES["GOOGLE"],
    STORAGE_WORKER_NAMES["POSTGRES"],
    FINALIZER_WORKER_NAME,
  ].map((queueName) => new Queue(queueName, { connection }));

  let teardownPromise = Promise.all([
    ...queues.map((q) => q.obliterate({ force: true })),
    blobFileManager.removeFolder(),
  ]);

  queues.forEach((q) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    teardownPromise = teardownPromise.finally(async () => {
      await q.close();
    });
  });

  await teardownPromise;
});
