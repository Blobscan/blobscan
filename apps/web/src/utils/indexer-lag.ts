import type { Chain } from "@blobscan/chains";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type IndexerLag = {
  lagMs: number;
  isOutOfSync: boolean;
};

/**
 * Calculates how far the last synced slot is behind the current time.
 * Returns undefined when the lag cannot be measured.
 */
export function getIndexerLag({
  chain,
  lastUpperSyncedSlot,
  thresholdMinutes,
}: {
  chain?: Chain;
  lastUpperSyncedSlot?: number | null;
  thresholdMinutes: number;
}): IndexerLag | undefined {
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
export function formatIndexerLag(lagMs: number) {
  if (lagMs < MS_PER_HOUR) {
    return pluralize(Math.max(1, Math.round(lagMs / MS_PER_MINUTE)), "minute");
  }

  if (lagMs < MS_PER_DAY) {
    return pluralize(Math.round(lagMs / MS_PER_HOUR), "hour");
  }

  return pluralize(Math.round(lagMs / MS_PER_DAY), "day");
}
