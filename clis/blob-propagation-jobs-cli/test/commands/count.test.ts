import { describe, expect, it, vi } from "vitest";

import { count, countCommandUsage } from "../../src/commands";
import { argHelpTest } from "../helpers";

describe("Count command", () => {
  argHelpTest(count, countCommandUsage);

  it("should count jobs for a set of given queues correctly", async () => {
    const consoleLogSpy = vi
      .spyOn(console, "log")
      .mockImplementationOnce(() => void {});

    await count(["-q", "google"]);

    expect(consoleLogSpy).toHaveBeenCalledOnce();
    expect(consoleLogSpy).toHaveBeenCalledWith([
      {
        count: {
          active: 0,
          completed: 0,
          delayed: 0,
          failed: 0,
          paused: 0,
          prioritized: 0,
          waiting: 0,
          ["waiting-children"]: 0,
        },
        queueName: "google-worker",
      },
    ]);
  });

  it("should count jobs for all queues correctly", async () => {
    const consoleLogSpy = vi
      .spyOn(console, "log")
      .mockImplementationOnce(() => void {});

    await count([]);

    expect(consoleLogSpy).toHaveBeenCalledOnce();
    expect(consoleLogSpy).toHaveBeenCalledWith([
      {
        count: {
          active: 0,
          completed: 0,
          delayed: 0,
          failed: 0,
          paused: 0,
          prioritized: 0,
          waiting: 0,
          ["waiting-children"]: 0,
        },
        queueName: "google-worker",
      },
      {
        count: {
          active: 0,
          completed: 0,
          delayed: 0,
          failed: 0,
          paused: 0,
          prioritized: 0,
          waiting: 0,
          ["waiting-children"]: 0,
        },
        queueName: "postgres-worker",
      },
    ]);
  });
});
