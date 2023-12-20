import type { ConnectionOptions, JobType } from "bullmq";
import { Queue } from "bullmq";

import type { BlobPropagationJobData } from "@blobscan/blob-propagator";
import {
  FINALIZER_WORKER_NAME,
  STORAGE_WORKER_NAMES,
} from "@blobscan/blob-propagator";
import { $Enums } from "@blobscan/db";

export class QueueManager {
  #storageQueues: Record<$Enums.BlobStorage, Queue<BlobPropagationJobData>>;
  #finalizerQueue: Queue;

  constructor(connection: ConnectionOptions) {
    this.#storageQueues = Object.values($Enums.BlobStorage).reduce(
      (queues, storage) => {
        queues[storage] = new Queue(STORAGE_WORKER_NAMES[storage], {
          connection,
        });

        return queues;
      },
      {} as Record<$Enums.BlobStorage, Queue>
    );

    this.#finalizerQueue = new Queue(FINALIZER_WORKER_NAME, {
      connection,
    });
  }

  getQueue(
    queueName: "FINALIZER" | $Enums.BlobStorage
  ): typeof queueName extends "FINALIZER"
    ? Queue
    : Queue<BlobPropagationJobData> {
    if (queueName === "FINALIZER") {
      return this.#finalizerQueue;
    }

    return this.#storageQueues[queueName];
  }

  getQueues(queueNames: ("FINALIZER" | $Enums.BlobStorage)[]) {
    return queueNames.map((queueName) => this.getQueue(queueName));
  }

  getStorageQueues() {
    return this.#storageQueues;
  }

  getJobs(types?: JobType[]) {
    return Promise.all([
      ...Object.values(this.#storageQueues).map((queue) =>
        queue.getJobs(types)
      ),
      this.#finalizerQueue.getJobs(types),
    ]).then((jobs) => jobs.flat());
  }

  drainQueues() {
    return Promise.all([
      ...Object.values(this.#storageQueues).map((queue) => queue.drain()),
      this.#finalizerQueue.drain(),
    ]);
  }

  obliterateQueues() {
    return Promise.all([
      ...Object.values(this.#storageQueues).map((queue) => queue.obliterate()),
      this.#finalizerQueue.obliterate(),
    ]);
  }

  close() {
    let teardownPromise = Promise.resolve();

    Object.values(this.#storageQueues).forEach((queue) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      teardownPromise = teardownPromise.finally(() => queue.close());
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    teardownPromise.finally(() => this.#finalizerQueue.close());

    return teardownPromise;
  }
}
