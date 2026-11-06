import type { Chain } from "@blobscan/chains";

import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from "./date";

export const DEFAULT_SYNC_LAG_THRESHOLD_MINUTES = 5;

export type SyncLag = {
  lagMs: number;
  isOutOfSync: boolean;
};

/**
 * Calculates how far the last synced slot is behind the current time.
 * Returns undefined when the function cannot measure the lag.
 */
export function getSyncLag({
  chain,
  lastUpperSyncedSlot,
  thresholdMinutes,
}: {
  chain?: Chain;
  lastUpperSyncedSlot?: number | null;
  thresholdMinutes: number;
}): SyncLag | undefined {
  if (
    !chain ||
    lastUpperSyncedSlot === null ||
    lastUpperSyncedSlot === undefined
  ) {
    return;
  }

  const lagMs = Math.max(
    0,
    Date.now() - chain.getSlotTimestamp(lastUpperSyncedSlot).getTime()
  );

  return {
    lagMs,
    isOutOfSync: lagMs > thresholdMinutes * MS_PER_MINUTE,
  };
}

function pluralize(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

/**
 * Rounds a lag to one human-readable unit: minutes, then hours, then days.
 */
export function formatSyncLag(lagMs: number) {
  if (lagMs < MS_PER_HOUR) {
    return pluralize(Math.max(1, Math.round(lagMs / MS_PER_MINUTE)), "minute");
  }

  if (lagMs < MS_PER_DAY) {
    return pluralize(Math.round(lagMs / MS_PER_HOUR), "hour");
  }

  return pluralize(Math.round(lagMs / MS_PER_DAY), "day");
}
