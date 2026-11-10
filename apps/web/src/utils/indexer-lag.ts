import type { Chain } from "@blobscan/chains";

import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from "./date";

// The banner shows when the indexer is more than this many minutes behind.
const INDEXER_LAG_THRESHOLD_MINUTES = 5;

export type IndexerLag = {
  lagMs: number;
  isOutOfSync: boolean;
};

/**
 * Calculates how far the last synced slot is behind the time at which the
 * client got it (`measuredAt`, in ms). Returns undefined when the function
 * cannot measure the lag.
 *
 * Do not use the current time as `measuredAt`. An old slot that the client
 * has not refetched yet (for example, on a tab that was in the background)
 * then gives a lag that is not real.
 */
export function getIndexerLag({
  chain,
  lastUpperSyncedSlot,
  measuredAt,
}: {
  chain?: Chain;
  lastUpperSyncedSlot?: number | null;
  measuredAt: number;
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
    measuredAt - chain.getSlotTimestamp(lastUpperSyncedSlot).getTime()
  );

  return {
    lagMs,
    isOutOfSync: lagMs > INDEXER_LAG_THRESHOLD_MINUTES * MS_PER_MINUTE,
  };
}

/**
 * Calculates the indexer lag from the result of the app state query.
 * Returns undefined when the function cannot measure the lag.
 */
export function getAppStateIndexerLag({
  chain,
  appState,
  isError,
  dataUpdatedAt,
}: {
  chain?: Chain;
  appState?: { syncState?: { lastUpperSyncedSlot?: number | null } | null };
  isError: boolean;
  dataUpdatedAt: number;
}): IndexerLag | undefined {
  // After a failed refetch, the query keeps the last data. Do not use that
  // old slot, because the API is down, not the indexer.
  if (isError) {
    return;
  }

  return getIndexerLag({
    chain,
    lastUpperSyncedSlot: appState?.syncState?.lastUpperSyncedSlot,
    // The periodic refetch updates the fetch time, so the lag still
    // increases while the indexer does not sync.
    measuredAt: dataUpdatedAt,
  });
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
