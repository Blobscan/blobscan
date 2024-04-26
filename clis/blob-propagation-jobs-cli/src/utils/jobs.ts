import type { Queue } from "bullmq";

import { buildJobId } from "@blobscan/blob-propagator";

export async function getJobsByBlobHashes(queue: Queue, blobHashes: string[]) {
  return Promise.all(
    blobHashes.map(async (blobHash) => {
      const jobId = buildJobId(queue.name, blobHash);
      const job = await queue.getJob(jobId);

      if (!job) {
        throw new Error(`Couldn't find job with id ${jobId}`);
      }

      return job;
    })
  );
}
