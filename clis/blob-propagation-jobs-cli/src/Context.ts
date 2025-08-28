import type { JobType } from "bullmq";
import { FlowProducer } from "bullmq";
import { Queue } from "bullmq";
import IORedis from "ioredis";

import type { BlobPropagationQueue } from "@blobscan/blob-propagator";
import { STORAGE_WORKER_NAMES } from "@blobscan/blob-propagator";
import type { BlobStorage } from "@blobscan/db/prisma/enums";

export type HumanQueueName = BlobStorage;

export class Context {
  #storageQueues: BlobPropagationQueue[];
  #propagatorFlowProducer: FlowProducer;

  constructor(storages: BlobStorage[], redisUri: string) {
    const uniqueStorageNames = [...new Set(storages)];
    const connection = new IORedis(redisUri, { maxRetriesPerRequest: null });

    this.#storageQueues = uniqueStorageNames.map(
      (storageName) =>
        new Queue(STORAGE_WORKER_NAMES[storageName], {
          connection,
        })
    );

    this.#propagatorFlowProducer = new FlowProducer({
      connection,
    });
  }

  getAllQueues() {
    return this.#storageQueues;
  }

  getQueue(queueName: HumanQueueName) {
    return this.#storageQueues.find(
      (q) => q.name === STORAGE_WORKER_NAMES[queueName]
    );
  }

  getQueues(queueNames: HumanQueueName[]) {
    return queueNames
      .map((queueName) => this.getQueue(queueName))
      .filter((q): q is BlobPropagationQueue => !!q);
  }

  getQueuesOrThrow(queueNames: HumanQueueName[]) {
    const queues = this.getQueues(queueNames);

    if (queues.length !== queueNames.length) {
      const notFoundQueueNames = queueNames.filter(
        (queueName) => !queues.find((q) => q.name === queueName)
      );

      throw new Error(
        `Could not find queues with the following names: ${notFoundQueueNames.join(
          ", "
        )}`
      );
    }

    return queues;
  }

  getAllStorageQueues() {
    return this.#storageQueues;
  }

  getPropagatorFlowProducer() {
    return this.#propagatorFlowProducer;
  }

  getJobs(types?: JobType[]) {
    return Promise.all(
      this.#storageQueues.map((queue) => queue.getJobs(types))
    ).then((jobs) => jobs.flat());
  }

  drainQueues() {
    return Promise.all(this.#storageQueues.map((queue) => queue.drain()));
  }

  obliterateQueues({ force = false } = {}) {
    return Promise.all(
      this.getAllQueues().map((queue) => queue.obliterate({ force }))
    );
  }

  async clearQueues() {
    await Promise.all((await this.getJobs()).map((j) => j.remove()));
  }

  close() {
    let teardownPromise = Promise.resolve();

    this.#storageQueues.forEach((queue) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      teardownPromise = teardownPromise.finally(() => queue.close());
    });

    return teardownPromise;
  }
}
