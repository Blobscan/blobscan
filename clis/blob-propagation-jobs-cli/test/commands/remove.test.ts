/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { SpyInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { remove, removeCommandUsage } from "../../src/commands";
import { context } from "../../src/context-instance";
import {
  argHelpTest,
  argInvalidBlobHashesTests,
  argInvalidQueueTests,
  setUpJobs,
} from "../helpers";

describe("Remove command", () => {
  const jobVersionedHashes = [
    "versionesHash1",
    "versionesHash2",
    "versionesHash3",
  ];

  beforeEach(async () => {
    const queues = context.getAllQueues();

    await setUpJobs(queues, jobVersionedHashes);
  });

  describe("when removing jobs given a specific queue", () => {
    it("should remove them correctly when a specific queue is given", async () => {
      const jobsBefore = await context.getJobs();
      const postgresQueue = context.getQueue("POSTGRES")!;

      await remove(["-q", "postgres"]);

      const jobsAfter = await context.getJobs();
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

      const jobsAfter = await context.getJobs();

      expect(jobsAfter.length, "Total jobs removed mismatch").toBe(0);
    });
  });

  it("should remove jobs related to the given blob hashes correctly", async () => {
    const jobsBefore = await context.getJobs();
    const blobHash1 = jobVersionedHashes[0] ?? "";
    const blobHash2 = jobVersionedHashes[1] ?? "";

    await remove(["-b", blobHash1, "-b", blobHash2]);

    const jobsAfter = await context.getJobs();
    const queueCounter = context.getAllQueues().length;

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
    const jobsBefore = await context.getJobs();
    const blobHash1 = jobVersionedHashes[0] ?? "";
    const blobHash2 = jobVersionedHashes[1] ?? "";

    await remove(["-q", "postgres", "-b", blobHash1, "-b", blobHash2]);

    const jobsAfter = await context.getJobs();
    const postgresJobs = await context.getQueue("POSTGRES")!.getJobs();

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
    let queueSpies: SpyInstance[];

    beforeEach(() => {
      queueSpies = context
        .getAllStorageQueues()
        .map((q) =>
          vi.spyOn(q, "obliterate").mockImplementation(async () => void {})
        );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should force remove the selected queues", async () => {
      const queueName1 = "postgres";
      const queueName2 = "google";

      const queueSpy1 = queueSpies[0];
      const queueSpy2 = queueSpies[1];

      await remove(["-f", "-q", queueName1, "-q", queueName2]);

      expect(
        queueSpy1,
        "Postgres storage queue calls mismatch"
      ).toHaveBeenCalledOnce();
      expect(
        queueSpy2,
        "Google storage queue calls mismatch"
      ).toHaveBeenCalledOnce();
    });

    it("should force remove all the queues when no queue is given", async () => {
      await remove(["-f"]);

      Object.entries(queueSpies).forEach(([storageName, queueSpy]) => {
        expect(
          queueSpy,
          `Storage ${storageName} queue wasn't force removed`
        ).toHaveBeenCalledOnce();
      });
    });
  });

  argHelpTest(remove, removeCommandUsage);

  argInvalidBlobHashesTests(remove);

  argInvalidQueueTests(remove);
});
