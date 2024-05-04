import { beforeEach, describe, expect, it, vi } from "vitest";

import { testValidError } from "@blobscan/test";

import { PeriodicUpdater } from "../src/PeriodicUpdater";
import type { PeriodicUpdaterConfig } from "../src/PeriodicUpdater";
import { PeriodicUpdaterError } from "../src/errors";

class PeriodicUpdaterMock extends PeriodicUpdater {
  constructor({
    name,
    redisUriOrConnection,
    updaterFn,
  }: Partial<PeriodicUpdaterConfig> = {}) {
    super({
      name: name ?? "test-updater",
      redisUriOrConnection: redisUriOrConnection ?? "redis://localhost:6379/1",
      updaterFn: updaterFn ?? (() => Promise.resolve()),
    });
  }

  getWorker() {
    return this.worker;
  }

  getQueue() {
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
      const cronPattern = "* * * * *";

      await periodicUpdater.start(cronPattern);

      const jobs = await queue.getRepeatableJobs();

      expect(jobs.length, "Expected one repeatable job").toBe(1);
      expect(jobs[0]?.pattern, "Repetable job cron pattern mismatch").toEqual(
        cronPattern
      );
    });

    testValidError(
      "should throw a valid error when failing to run",
      async () => {
        const queue = periodicUpdater.getQueue();

        vi.spyOn(queue, "add").mockRejectedValueOnce(new Error("Queue error"));

        await periodicUpdater.start("* * * * *");
      },
      PeriodicUpdaterError,
      { checkCause: true }
    );
  });

  describe("when closing an updater", () => {
    it("should close correctly", async () => {
      const queue = periodicUpdater.getQueue();
      const worker = periodicUpdater.getWorker();

      const queueCloseSpy = vi.spyOn(queue, "close").mockResolvedValueOnce();
      const queueRemoveAllListenersSpy = vi
        .spyOn(queue, "removeAllListeners")
        .mockReturnValueOnce(queue);

      const workerCloseSpy = vi.spyOn(worker, "close").mockResolvedValueOnce();
      const workerRemoveAllListenersSpy = vi
        .spyOn(worker, "removeAllListeners")
        .mockReturnValueOnce(worker);

      await periodicUpdater.close();

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
    PeriodicUpdaterError,
    {
      checkCause: true,
    }
  );
});
