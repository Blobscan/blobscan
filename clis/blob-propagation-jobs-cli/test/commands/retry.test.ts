/* eslint-disable @typescript-eslint/no-misused-promises */
import { Worker } from "bullmq";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import type { BlobPropagationWorker } from "@blobscan/blob-propagator";

import { retry, retryCommandUsage } from "../../src/commands";
import { queueManager } from "../../src/queue-manager";
import { connection } from "../../src/utils";
import { processJobsManually, runHelpArgTests, setUpJobs } from "../helpers";

describe("Retry command", () => {
  let storageWorkers: BlobPropagationWorker[];
  const jobVersionedHashes = [
    "versionesHash1",
    "versionesHash2",
    "versionesHash3",
  ];

  beforeEach(async () => {
    const storageQueues = Object.values(queueManager.getStorageQueues());

    storageWorkers = storageQueues.map(
      (queue) => new Worker(queue.name, undefined, { connection })
    );

    await setUpJobs(storageQueues, jobVersionedHashes);
    await Promise.all(
      storageWorkers.map((worker) =>
        processJobsManually(worker, (job, token) =>
          job.moveToFailed(new Error(`Job with id ${job.id} failed`), token)
        )
      )
    );
  });

  afterEach(async () => {
    await queueManager.drainQueues();
  });

  it("should retry all failed jobs correctly", async () => {
    await retry();

    const failedJobsAfterRetry = await queueManager.getJobs(["failed"]);

    expect(failedJobsAfterRetry.length).toBe(0);
  });

  it("should retry failed jobs from a specific queue correctly", async () => {
    await retry(["-q", "POSTGRES"]);

    const failedJobsAfterRetry = await queueManager.getJobs(["failed"]);
    const postgresFailedJobs = failedJobsAfterRetry.filter((j) =>
      j.id?.includes("postgres")
    );
    const storageQueuesCount = Object.values(
      queueManager.getStorageQueues()
    ).length;

    expect(failedJobsAfterRetry.length, "Total jobs mismatch").toBe(
      jobVersionedHashes.length * (storageQueuesCount - 1)
    );
    expect(postgresFailedJobs, "Specific queue jobs mismatch").toEqual([]);
  });

  it("should retry failed jobs with a specific blob hash correctly", async () => {
    const failedJobsBeforeRetry = await queueManager.getJobs(["failed"]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const versionedHash = jobVersionedHashes[0]!;
    await retry(["-b", versionedHash]);

    const failedJobsAfterRetry = await queueManager.getJobs(["failed"]);
    const versionedHashFailedJobs = failedJobsAfterRetry.filter((j) =>
      j.id?.includes(versionedHash)
    );

    const jobVersionedHashCount =
      1 * Object.values(queueManager.getStorageQueues()).length;

    expect(failedJobsAfterRetry.length, "Total jobs mismatch").toBe(
      failedJobsBeforeRetry.length - jobVersionedHashCount
    );
    expect(
      versionedHashFailedJobs,
      "Specific blob versioned hash jobs mismatch"
    ).toEqual([]);
  });

  runHelpArgTests(retry, retryCommandUsage);

  it("should fail when providing non-existing blob hashes", () => {
    expect(
      retry(["-q", "postgres", "-b", "invalid-blob-hash"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Couldn\'t find job with id postgres-worker-invalid-blob-hash"'
    );
  });

  it("should fail when providing a non-existing queue", () => {
    expect(
      retry(["-q", "invalid-queue-name"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Invalid queue name: invalid-queue-name"'
    );
  });

  afterAll(async () => {
    let teardownPromise = Promise.resolve();

    storageWorkers.forEach((worker) => {
      teardownPromise = teardownPromise.finally(() => worker.close());
    });

    await teardownPromise;
  });
});
