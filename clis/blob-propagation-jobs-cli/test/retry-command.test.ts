/* eslint-disable @typescript-eslint/no-misused-promises */
import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { randomUUID } from "crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import type { BlobPropagationJobData } from "@blobscan/blob-propagator";
import { buildJobId } from "@blobscan/blob-propagator";

import { retry } from "../src/commands";
import { connection } from "../src/common";
import { queueManager } from "../src/queue-manager";

describe("Retry command", () => {
  let storageWorkers: Worker<BlobPropagationJobData>[];
  const jobVersionedHashes = [
    "versionesHash1",
    "versionesHash2",
    "versionesHash3",
  ];

  beforeEach(async () => {
    const storageQueues = Object.values(queueManager.getStorageQueues());

    await Promise.all(
      storageQueues.map(async (queue) => {
        const jobs = jobVersionedHashes.map<Job<BlobPropagationJobData>>(
          (versionedHash) =>
            ({
              name: `testJob-${buildJobId(queue, versionedHash)}`,
              data: {
                versionedHash,
              },
              opts: {
                jobId: buildJobId(queue, versionedHash),
              },
            } as Job<BlobPropagationJobData>)
        );

        return queue.addBulk(jobs);
      })
    );

    storageWorkers = storageQueues.map(
      (queue) => new Worker(queue.name, undefined, { connection })
    );

    await Promise.all(
      storageWorkers.map(async (worker) => {
        const token = randomUUID();
        let job = await worker.getNextJob(token);

        while (job) {
          await job.moveToFailed(
            new Error(`Job with id ${job.id} failed`),
            token
          );

          job = await worker.getNextJob(token);
        }
      })
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
    let teardownPromise = queueManager
      .obliterateQueues()
      .finally(() => queueManager.close());

    storageWorkers.forEach((worker) => {
      teardownPromise = teardownPromise.finally(() => worker.close());
    });

    await teardownPromise;
  });
});
