/* eslint-disable @typescript-eslint/no-misused-promises */
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { BlobPropagationWorker } from "@blobscan/blob-propagator";
import { env } from "@blobscan/env";

import { retry, retryCommandUsage } from "../../src/commands";
import { context } from "../../src/context-instance";
import {
  processJobsManually,
  argHelpTest,
  setUpJobs,
  argInvalidBlobHashesTests,
} from "../helpers";

describe("Retry command", () => {
  let storageWorkers: BlobPropagationWorker[];
  const jobVersionedHashes = [
    "versionsHash1",
    "versionsHash2",
    "versionsHash3",
  ];

  beforeEach(async () => {
    const queues = context.getAllQueues();

    storageWorkers = queues.map(
      (queue) =>
        new Worker(queue.name, undefined, {
          connection: new IORedis(env.REDIS_URI, {
            maxRetriesPerRequest: null,
          }),
        })
    );

    await setUpJobs(queues, jobVersionedHashes);
    await Promise.all(
      storageWorkers.map((worker) =>
        processJobsManually(worker, (job, token) =>
          job.moveToFailed(new Error(`Job with id ${job.id} failed`), token)
        )
      )
    );
  });

  it("should retry all failed jobs correctly", async () => {
    await retry();

    const failedJobsAfterRetry = await context.getJobs(["failed"]);

    expect(failedJobsAfterRetry.length).toBe(0);
  });

  it("should retry failed jobs from a specific queue correctly", async () => {
    await retry(["-q", "postgres"]);

    const failedJobsAfterRetry = await context.getJobs(["failed"]);
    const postgresFailedJobs = failedJobsAfterRetry.filter((j) =>
      j.id?.includes("postgres")
    );
    const storageQueuesCount = context.getAllQueues().length;

    expect(failedJobsAfterRetry.length, "Total jobs mismatch").toBe(
      jobVersionedHashes.length * (storageQueuesCount - 1)
    );
    expect(postgresFailedJobs, "Specific queue jobs mismatch").toEqual([]);
  });

  it("should retry failed jobs with a specific blob hash correctly", async () => {
    const failedJobsBeforeRetry = await context.getJobs(["failed"]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const versionedHash = jobVersionedHashes[0]!;

    await retry(["-b", versionedHash]);

    const failedJobsAfterRetry = await context.getJobs(["failed"]);
    const versionedHashFailedJobs = failedJobsAfterRetry.filter((j) =>
      j.id?.includes(versionedHash)
    );

    const jobVersionedHashCount = 1 * context.getAllQueues().length;

    expect(failedJobsAfterRetry.length, "Total jobs mismatch").toBe(
      failedJobsBeforeRetry.length - jobVersionedHashCount
    );
    expect(
      versionedHashFailedJobs,
      "Specific blob versioned hash jobs mismatch"
    ).toEqual([]);
  });

  argHelpTest(retry, retryCommandUsage);

  argInvalidBlobHashesTests(retry);

  argInvalidBlobHashesTests(retry);

  afterAll(async () => {
    let teardownPromise = Promise.resolve();

    storageWorkers.forEach((worker) => {
      teardownPromise = teardownPromise.finally(() => worker.close());
    });

    await teardownPromise;
  });
});
