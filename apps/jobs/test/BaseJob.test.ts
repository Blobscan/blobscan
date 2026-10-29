import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { testValidError } from "@blobscan/test";

import { JobError } from "../src/errors";
import { BaseJob } from "../src/jobs";
import type { BaseJobConfig } from "../src/jobs";

class BaseJobMock extends BaseJob {
  constructor({ name, cronPattern, jobFn }: Partial<BaseJobConfig> = {}) {
    super({
      name: name ?? "test",
      cronPattern: cronPattern ?? "* * * * *",
      jobFn: jobFn ?? (() => Promise.resolve()),
    });
  }

  getCron() {
    return this.cron;
  }
}

describe("BaseJob", () => {
  let job: BaseJobMock;

  beforeEach(() => {
    job = new BaseJobMock();
  });

  afterEach(async () => {
    await job.stop();
  });

  describe("when starting a job", () => {
    it("should schedule the job with the cron pattern", () => {
      job.start();

      const cron = job.getCron();

      expect(cron, "Expected a cron to be scheduled").toBeDefined();
      expect(cron?.getPattern()).toBe("* * * * *");
      expect(cron?.isRunning(), "Expected the cron to be running").toBe(true);
    });

    it("should not schedule the job two times", () => {
      job.start();

      const cron = job.getCron();

      job.start();

      expect(job.getCron()).toBe(cron);
    });

    testValidError(
      "should throw a valid error when the cron pattern is invalid",
      () => {
        new BaseJobMock({ cronPattern: "invalid" }).start();
      },
      JobError,
      { checkCause: true }
    );
  });

  describe("when running a job", () => {
    it("should call the job function", async () => {
      const jobFn = vi.fn(() => Promise.resolve());
      const runningJob = new BaseJobMock({ jobFn });

      await runningJob.run();

      expect(jobFn).toHaveBeenCalledOnce();
    });

    it("should not throw when the job function fails", async () => {
      const failingJob = new BaseJobMock({
        jobFn: () => Promise.reject(new Error("Job function error")),
      });

      await expect(failingJob.run()).resolves.toBeUndefined();
    });
  });

  describe("when stopping a job", () => {
    it("should stop the cron", async () => {
      job.start();

      const cron = job.getCron();

      await job.stop();

      expect(cron?.isStopped(), "Expected the cron to be stopped").toBe(true);
      expect(job.getCron()).toBeUndefined();
    });

    it("should wait for the active run to complete", async () => {
      let completed = false;
      const slowJob = new BaseJobMock({
        jobFn: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));

          completed = true;
        },
      });

      void slowJob.run();

      await slowJob.stop();

      expect(completed, "Expected the active run to complete").toBe(true);
    });

    it("should stop when the active run does not complete in time", async () => {
      const hangingJob = new BaseJobMock({
        jobFn: () => new Promise(() => undefined),
      });

      void hangingJob.run();

      await expect(hangingJob.stop(10)).resolves.toBeUndefined();
    });
  });
});
