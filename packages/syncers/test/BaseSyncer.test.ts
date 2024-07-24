import { beforeEach, describe, expect, it, vi } from "vitest";

import { testValidError } from "@blobscan/test";

import { BaseSyncer } from "../src/BaseSyncer";
import type { BaseSyncerConfig } from "../src/BaseSyncer";
import { SyncerError } from "../src/errors";

class PeriodicUpdaterMock extends BaseSyncer {
  constructor({ name, syncerFn: updaterFn }: Partial<BaseSyncerConfig> = {}) {
    super({
      name: name ?? "test-updater",
      redisUriOrConnection: "redis://localhost:6379/1",
      cronPattern: "* * * * *",
      syncerFn: updaterFn ?? (() => Promise.resolve()),
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

describe("PeriodicUpdater", () => {
  let periodicUpdater: PeriodicUpdaterMock;

  beforeEach(() => {
    periodicUpdater = new PeriodicUpdaterMock();

    return async () => {
      await periodicUpdater.close();
    };
  });

  it("should create an updater correctly", async () => {
    const queue = periodicUpdater.getQueue();
    const worker = periodicUpdater.getWorker();
    const isPaused = await queue.isPaused();

    expect(worker.isRunning(), "Expected worker to be running").toBeTruthy();
    expect(isPaused, "Expected queue to be running").toBeFalsy();
  });

  describe("when running an updater", () => {
    it("should set up a repeatable job correctly", async () => {
      const queue = periodicUpdater.getQueue();

      await periodicUpdater.start();

      const jobs = await queue.getRepeatableJobs();

      expect(jobs.length, "Expected one repeatable job").toBe(1);
      expect(jobs[0]?.pattern, "Repetable job cron pattern mismatch").toEqual(
        "* * * * *"
      );
    });

    testValidError(
      "should throw a valid error when failing to run",
      async () => {
        const queue = periodicUpdater.getQueue();

        vi.spyOn(queue, "add").mockRejectedValueOnce(new Error("Queue error"));

        await periodicUpdater.start();
      },
      SyncerError,
      { checkCause: true }
    );
  });

  describe("when closing an updater", () => {
    it("should close correctly", async () => {
      const closingPeriodicUpdater = new PeriodicUpdaterMock();

      await closingPeriodicUpdater.start();

      const queue = closingPeriodicUpdater.getQueue();
      const worker = closingPeriodicUpdater.getWorker();

      const queueCloseSpy = vi.spyOn(queue, "close").mockResolvedValueOnce();
      const queueRemoveAllListenersSpy = vi
        .spyOn(queue, "removeAllListeners")
        .mockReturnValueOnce(queue);

      const workerCloseSpy = vi.spyOn(worker, "close").mockResolvedValueOnce();
      const workerRemoveAllListenersSpy = vi
        .spyOn(worker, "removeAllListeners")
        .mockReturnValueOnce(worker);

      await closingPeriodicUpdater.close();

      expect(queueCloseSpy).toHaveBeenCalledOnce();
      expect(workerCloseSpy).toHaveBeenCalledOnce();

      expect(queueRemoveAllListenersSpy).toHaveBeenCalledOnce();
      expect(workerRemoveAllListenersSpy).toHaveBeenCalledOnce();
    });
  });

  testValidError(
    "should throw a valid error when failing to close it",
    async () => {
      const queue = periodicUpdater.getQueue();
      const worker = periodicUpdater.getWorker();

      vi.spyOn(queue, "close").mockRejectedValueOnce(
        new Error("Queue closing error")
      );
      vi.spyOn(worker, "close").mockRejectedValueOnce(
        new Error("Worker closing error")
      );

      await periodicUpdater.close();
    },
    SyncerError,
    {
      checkCause: true,
    }
  );
});
