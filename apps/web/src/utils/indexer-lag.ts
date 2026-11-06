import type { Chain } from "@blobscan/chains";

import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from "./date";

// The banner shows when the indexer is more than this many minutes behind.
const INDEXER_LAG_THRESHOLD_MINUTES = 5;

export type IndexerLag = {
  lagMs: number;
  isOutOfSync: boolean;
};

/**
 * Calculates how far the last synced slot is behind the current time.
 * Returns undefined when the function cannot measure the lag.
 */
export function getIndexerLag({
  chain,
  lastUpperSyncedSlot,
}: {
  chain?: Chain;
  lastUpperSyncedSlot?: number | null;
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
    isOutOfSync: lagMs > INDEXER_LAG_THRESHOLD_MINUTES * MS_PER_MINUTE,
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
