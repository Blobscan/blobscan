import { beforeEach, describe, expect, it, vi } from "vitest";

import { testValidError } from "@blobscan/test";

import { createRedisConnection } from "../src";
import { BaseSyncer } from "../src/BaseSyncer";
import { SyncerError } from "../src/errors";

describe("BaseSyncer", () => {
  let syncer: BaseSyncer;

  beforeEach(() => {
    syncer = new BaseSyncer({
      name: "test-updater",
      connection: createRedisConnection("redis://localhost:6379/1"),
      cronPattern: "* * * * *",
      syncerFn: async () => {
        return;
      },
    });

    return async () => syncer.close();
  });

  it("should create an updater correctly", async () => {
    const isPaused = await syncer.queue.isPaused();

    expect(
      syncer.worker.isRunning(),
      "Expected worker to be running"
    ).toBeTruthy();
    expect(isPaused, "Expected queue to be running").toBeFalsy();
  });

  describe("when running an updater", () => {
    it("should set up a repeatable job correctly", async () => {
      await syncer.start();

      const jobs = await syncer.queue.getRepeatableJobs();

      expect(jobs.length, "Expected one repeatable job").toBe(1);
      expect(jobs[0]?.pattern, "Repetable job cron pattern mismatch").toEqual(
        "* * * * *"
      );
    });

    testValidError(
      "should throw a valid error when failing to run",
      async () => {
        vi.spyOn(syncer.queue, "add").mockRejectedValueOnce(
          new Error("Queue error")
        );

        await syncer.start();
      },
      SyncerError,
      { checkCause: true }
    );
  });

  describe("when closing an updater", () => {
    it("should close correctly", async () => {
      await syncer.start();

      const queue = syncer.queue;
      const worker = syncer.worker;

      const queueCloseSpy = vi.spyOn(queue, "close").mockResolvedValueOnce();
      const queueRemoveAllListenersSpy = vi
        .spyOn(queue, "removeAllListeners")
        .mockReturnValueOnce(queue);

      const workerCloseSpy = vi.spyOn(worker, "close").mockResolvedValueOnce();
      const workerRemoveAllListenersSpy = vi
        .spyOn(worker, "removeAllListeners")
        .mockReturnValueOnce(worker);

      await syncer.close();

      expect(queueCloseSpy).toHaveBeenCalledOnce();
      expect(workerCloseSpy).toHaveBeenCalledOnce();

      expect(queueRemoveAllListenersSpy).toHaveBeenCalledOnce();
      expect(workerRemoveAllListenersSpy).toHaveBeenCalledOnce();
    });
  });

  testValidError(
    "should throw a valid error when failing to close it",
    async () => {
      vi.spyOn(syncer.queue, "close").mockRejectedValueOnce(
        new Error("Queue closing error")
      );
      vi.spyOn(syncer.worker, "close").mockRejectedValueOnce(
        new Error("Worker closing error")
      );

      await syncer.close();
    },
    SyncerError,
    {
      checkCause: true,
    }
  );
});
