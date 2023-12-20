/* eslint-disable @typescript-eslint/no-misused-promises */
import type { SpyInstance } from "vitest";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { remove, removeCommandUsage } from "../../src/commands";
import { queueManager } from "../../src/queue-manager";
import { runHelpArgTests, setUpJobs } from "../helpers";

describe("Remove command", () => {
  const jobVersionedHashes = [
    "versionesHash1",
    "versionesHash2",
    "versionesHash3",
  ];

  beforeEach(async () => {
    const storageQueues = Object.values(queueManager.getStorageQueues());

    await setUpJobs(storageQueues, jobVersionedHashes);
  });

  describe("when removing jobs given a specific queue", () => {
    it("should remove them correctly when a specific queue is given", async () => {
      const jobsBefore = await queueManager.getJobs();
      const postgresQueue = queueManager.getQueue("POSTGRES");

      await remove(["-q", "POSTGRES"]);

      const jobsAfter = await queueManager.getJobs();
      const postgresJobsAfter = await postgresQueue.getJobs();

      expect(
        jobsBefore.length - jobsAfter.length,
        "Total jobs removed mismatch"
      ).toBe(jobVersionedHashes.length);
      expect(
        postgresJobsAfter.length,
        "Specified queue jobs still exists"
      ).toBe(0);
    });

    it("should remove jobs from all the queues when no queue is given", async () => {
      await remove();

      const jobsAfter = await queueManager.getJobs();

      expect(jobsAfter.length, "Total jobs removed mismatch").toBe(0);
    });
  });

  it("should remove jobs related to the given blob hashes correctly", async () => {
    const jobsBefore = await queueManager.getJobs();
    const blobHash1 = jobVersionedHashes[0] ?? "";
    const blobHash2 = jobVersionedHashes[1] ?? "";

    await remove(["-b", blobHash1, "-b", blobHash2]);

    const jobsAfter = await queueManager.getJobs();
    const queueCounter = Object.values(queueManager.getStorageQueues()).length;

    expect(
      jobsBefore.length - jobsAfter.length,
      "Total jobs removed mismatch"
    ).toBe(queueCounter * 2);
    expect(
      jobsAfter.filter((j) => [blobHash1, blobHash2].includes(j.id ?? ""))
        .length,
      "Specified blob hash jobs still exists"
    ).toBe(0);
  });

  it("should remove jobs related to the given blob hashes and queue correctly", async () => {
    const jobsBefore = await queueManager.getJobs();
    const blobHash1 = jobVersionedHashes[0] ?? "";
    const blobHash2 = jobVersionedHashes[1] ?? "";

    await remove(["-q", "POSTGRES", "-b", blobHash1, "-b", blobHash2]);

    const jobsAfter = await queueManager.getJobs();
    const postgresJobs = await queueManager.getQueue("POSTGRES").getJobs();

    expect(
      jobsBefore.length - jobsAfter.length,
      "Total jobs removed mismatch"
    ).toBe(2);
    expect(
      postgresJobs.filter((j) => [blobHash1, blobHash2].includes(j.id ?? ""))
        .length,
      "Specified blob hash jobs still exists"
    ).toBe(0);
  });

  describe("when force flag is given", () => {
    let queueSpies: Record<string, SpyInstance>;

    beforeEach(() => {
      queueSpies = Object.entries(queueManager.getStorageQueues()).reduce(
        (acc, [storageName, queue]) => ({
          ...acc,
          [storageName]: vi
            .spyOn(queue, "obliterate")
            .mockImplementation(async () => void {}),
        }),
        {} as Record<string, SpyInstance>
      );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should force remove the selected queues", async () => {
      const queueName1 = "POSTGRES";
      const queueName2 = "SWARM";

      const queueSpy1 = queueSpies[queueName1];
      const queueSpy2 = queueSpies[queueName2];

      await remove(["-f", "-q", queueName1, "-q", queueName2]);

      expect(queueSpy1).toHaveBeenCalledOnce();
      expect(queueSpy2).toHaveBeenCalledOnce();
    });

    it("should force remove all the queues when no queue is given", async () => {
      await remove(["-f"]);

      Object.entries(queueSpies).forEach(([storageName, queueSpy]) => {
        expect(
          queueSpy,
          `Storage ${storageName} queue wansn't force removed`
        ).toHaveBeenCalledOnce();
      });
    });
  });

  runHelpArgTests(remove, removeCommandUsage);

  it("should fail when providing non-existing blob hashes", () => {
    expect(
      remove(["-q", "postgres", "-b", "invalid-blob-hash"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Couldn\'t find job with id postgres-worker-invalid-blob-hash"'
    );
  });

  it("should fail when providing a non-existing queue", () => {
    expect(
      remove(["-q", "invalid-queue-name"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Invalid queue name: invalid-queue-name"'
    );
  });

  afterAll(async () => {
    await queueManager.obliterateQueues().finally(() => queueManager.close());
  });
});
