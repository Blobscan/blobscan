import { randomUUID } from "crypto";
import { expect, it, vi } from "vitest";

import { buildJobId } from "@blobscan/blob-propagator";
import type {
  BlobPropagationJob,
  BlobPropagationQueue,
  BlobPropagationWorker,
} from "@blobscan/blob-propagator";

import type { Context } from "../src/Context";
import type { Command } from "../src/types";

export function setUpJobs(
  queues: BlobPropagationQueue[],
  blobHashes: string[]
) {
  return Promise.all(
    queues.map(async (queue) => {
      const jobs = blobHashes.map<BlobPropagationJob>(
        (versionedHash) =>
          ({
            name: buildJobId("test", "job", queue.name, versionedHash),
            data: {
              versionedHash,
            },
            opts: {
              jobId: buildJobId(queue.name, versionedHash),
            },
          } as BlobPropagationJob)
      );

      return queue.addBulk(jobs);
    })
  );
}

export async function processJobsManually(
  worker: BlobPropagationWorker,
  jobProcessor: (job: BlobPropagationJob, token: string) => Promise<void>
) {
  const token = randomUUID();
  let job = await worker.getNextJob(token);

  while (job) {
    jobProcessor(job, token);

    job = await worker.getNextJob(token);
  }
}

export async function assertCreatedJobs(
  context: Context,
  blobHashes: string[]
): Promise<void> {
  const queues = context.getAllStorageQueues();
  const createdJobs = await context.getJobs();

  queues.forEach((q) => {
    const queueJobVersionedHashes = createdJobs
      .filter((j) => j.queueName === q.name)
      .map((j) => j.data.versionedHash)
      .sort((a, b) => a.localeCompare(b));

    expect(
      queueJobVersionedHashes,
      `Created jobs mismatch in ${q.name} queue`
    ).toEqual(blobHashes.sort((a, b) => a.localeCompare(b)));
  });
}

export function argHelpTest(c: Command, expectedDisplayedUsage: string) {
  it("should display the command usage when the help flag is given", async () => {
    const consoleLogSpy = vi
      .spyOn(console, "log")
      .mockImplementationOnce(() => void {});

    await c(["-h"]);

    expect(
      consoleLogSpy,
      "Usage displayed more than once"
    ).toHaveBeenCalledOnce();
    expect(consoleLogSpy, "Invalid usage displayed").toHaveBeenCalledWith(
      expectedDisplayedUsage
    );
  });
}

export function argInvalidQueueTests(c: Command) {
  it("should fail when providing a non-existing queue", () => {
    expect(
      c(["-q", "invalid-queue-name"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid queue 'invalid-queue-name'. Valid values are finalizer, file_system, google, postgres, swarm."`
    );
  });
}

export function argInvalidBlobHashesTests(c: Command) {
  it("should fail when providing non-existing blob hashes", () => {
    expect(
      c(["-q", "postgres", "-b", "invalid-blob-hash"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Couldn\'t find job with id postgres-worker-invalid-blob-hash"'
    );
  });
}
