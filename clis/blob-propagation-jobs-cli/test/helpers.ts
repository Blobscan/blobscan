import { randomUUID } from "crypto";
import { expect, it, vi } from "vitest";

import { buildJobId } from "@blobscan/blob-propagator";
import type {
  BlobPropagationJob,
  BlobPropagationQueue,
  BlobPropagationWorker,
} from "@blobscan/blob-propagator";

export function setUpJobs(
  queues: BlobPropagationQueue[],
  blobHashes: string[]
) {
  return Promise.all(
    queues.map(async (queue) => {
      const jobs = blobHashes.map<BlobPropagationJob>(
        (versionedHash) =>
          ({
            name: `testJob-${buildJobId(queue, versionedHash)}`,
            data: {
              versionedHash,
            },
            opts: {
              jobId: buildJobId(queue, versionedHash),
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

export function runHelpArgTests(
  command: (argv?: string[]) => unknown,
  expectedDisplayedUsage: string
) {
  it("should display the command usage when the help flag is given", async () => {
    const consoleLogSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => void {});

    await command(["-h"]);

    expect(
      consoleLogSpy,
      "Usage displayed more than once"
    ).toHaveBeenCalledOnce();
    expect(consoleLogSpy, "Invalid usage displayed").toHaveBeenCalledWith(
      expectedDisplayedUsage
    );
  });
}
