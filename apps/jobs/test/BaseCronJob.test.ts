import { beforeEach, describe, expect, it, vi } from "vitest";

import { testValidError } from "@blobscan/test";

import { BaseCronJob, CronJobError } from "../src/BaseCronJob";
import type { BaseCronJobConfig } from "../src/BaseCronJob";

class BaseCronJobMock extends BaseCronJob {
  constructor({ name, jobFn }: Partial<BaseCronJobConfig> = {}) {
    super({
      name: name ?? "test-updater",
      redisUriOrConnection: "redis://localhost:6379/1",
      cronPattern: "* * * * *",
      jobFn: jobFn ?? (() => Promise.resolve()),
    });
  }

  getWorker() {
    if (!this.worker) throw new Error("Worker not initialized");

    return this.worker;
  }

  getQueue() {
    if (!this.queue) throw new Error("Queue not initialized");

    return this.queue;
  }
}

describe("BaseCronJob", () => {
  let cronJob: BaseCronJobMock;

  beforeEach(() => {
    cronJob = new BaseCronJobMock();

    return async () => {
      await cronJob.close();
    };
  });

  it("should create an updater correctly", async () => {
    const queue = cronJob.getQueue();
    const worker = cronJob.getWorker();
    const isPaused = await queue.isPaused();

    expect(worker.isRunning(), "Expected worker to be running").toBeTruthy();
    expect(isPaused, "Expected queue to be running").toBeFalsy();
  });

  describe("when running an updater", () => {
    it("should set up a repeatable job correctly", async () => {
      const queue = cronJob.getQueue();

      await cronJob.start();

      const jobs = await queue.getRepeatableJobs();

      expect(jobs.length, "Expected one repeatable job").toBe(1);
      expect(jobs[0]?.pattern, "Repetable job cron pattern mismatch").toEqual(
        "* * * * *"
      );
    });

    testValidError(
      "should throw a valid error when failing to run",
      async () => {
        const queue = cronJob.getQueue();

        vi.spyOn(queue, "add").mockRejectedValueOnce(new Error("Queue error"));

        await cronJob.start();
      },
      CronJobError,
      { checkCause: true }
    );
  });

  describe("when closing an updater", () => {
    it("should close correctly", async () => {
      const closingCronJob = new BaseCronJobMock();

      await closingCronJob.start();

      const queue = closingCronJob.getQueue();
      const worker = closingCronJob.getWorker();

      const queueCloseSpy = vi.spyOn(queue, "close").mockResolvedValueOnce();
      const queueRemoveAllListenersSpy = vi
        .spyOn(queue, "removeAllListeners")
        .mockReturnValueOnce(queue);

      const workerCloseSpy = vi.spyOn(worker, "close").mockResolvedValueOnce();
      const workerRemoveAllListenersSpy = vi
        .spyOn(worker, "removeAllListeners")
        .mockReturnValueOnce(worker);

      await closingCronJob.close();

      expect(queueCloseSpy).toHaveBeenCalledOnce();
      expect(workerCloseSpy).toHaveBeenCalledOnce();

      expect(queueRemoveAllListenersSpy).toHaveBeenCalledOnce();
      expect(workerRemoveAllListenersSpy).toHaveBeenCalledOnce();
    });
  });

  testValidError(
    "should throw a valid error when failing to close it",
    async () => {
      const queue = cronJob.getQueue();
      const worker = cronJob.getWorker();

      vi.spyOn(queue, "close").mockRejectedValueOnce(
        new Error("Queue closing error")
      );
      vi.spyOn(worker, "close").mockRejectedValueOnce(
        new Error("Worker closing error")
      );

      await cronJob.close();
    },
    CronJobError,
    {
      checkCause: true,
    }
  );
});
