import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { chains } from "@blobscan/chains";

import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from "~/utils/date";
import { formatSyncLag, getSyncLag } from "~/utils/sync-lag";

const { mainnet } = chains;

describe("when getting the sync lag", () => {
  const { activationSlot, activationDate } = mainnet.latestFork;
  const anchorMs = activationDate.getTime();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return undefined when there is no chain", () => {
    expect(
      getSyncLag({
        lastUpperSyncedSlot: activationSlot,
        thresholdMinutes: 5,
      })
    ).toBeUndefined();
  });

  it("should return undefined when there is no last synced slot", () => {
    expect(
      getSyncLag({
        chain: mainnet,
        lastUpperSyncedSlot: null,
        thresholdMinutes: 5,
      })
    ).toBeUndefined();
  });

  it("should not be out of sync when the lag is below the threshold", () => {
    vi.setSystemTime(anchorMs + 4 * MS_PER_MINUTE);

    expect(
      getSyncLag({
        chain: mainnet,
        lastUpperSyncedSlot: activationSlot,
        thresholdMinutes: 5,
      })
    ).toEqual({ lagMs: 4 * MS_PER_MINUTE, isOutOfSync: false });
  });

  it("should be out of sync when the lag is above the threshold", () => {
    vi.setSystemTime(anchorMs + 10 * MS_PER_MINUTE);

    expect(
      getSyncLag({
        chain: mainnet,
        lastUpperSyncedSlot: activationSlot + 10,
        thresholdMinutes: 5,
      })
    ).toEqual({ lagMs: 10 * MS_PER_MINUTE - 10 * 12_000, isOutOfSync: true });
  });

  it("should not return a negative lag when the slot is ahead of the clock", () => {
    vi.setSystemTime(anchorMs);

    expect(
      getSyncLag({
        chain: mainnet,
        lastUpperSyncedSlot: activationSlot + 100,
        thresholdMinutes: 5,
      })
    ).toEqual({ lagMs: 0, isOutOfSync: false });
  });
});

describe("when formatting the sync lag", () => {
  it.each([
    [30_000, "1 minute"],
    [25 * MS_PER_MINUTE, "25 minutes"],
    [MS_PER_HOUR, "1 hour"],
    [5 * MS_PER_HOUR, "5 hours"],
    [MS_PER_DAY, "1 day"],
    [3 * MS_PER_DAY, "3 days"],
  ])("should format %d ms as %s", (lagMs, expected) => {
    expect(formatSyncLag(lagMs)).toBe(expected);
  });
});
