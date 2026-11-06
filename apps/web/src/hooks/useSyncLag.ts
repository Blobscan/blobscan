import { useEffect, useState } from "react";

import { MS_PER_MINUTE } from "~/utils/date";
import {
  DEFAULT_SYNC_LAG_THRESHOLD_MINUTES,
  getSyncLag,
} from "~/utils/sync-lag";
import { useAppState } from "~/providers/AppState";
import { useEnv } from "~/providers/Env";
import { useChain } from "./useChain";

/**
 * Returns how far the indexer is behind the chain. Returns undefined when the
 * hook cannot measure the lag.
 */
export function useSyncLag() {
  const { env } = useEnv();
  const { appState, isError } = useAppState();
  const chain = useChain();
  // When the validation of the env vars is off, the value can be a string or
  // it can be missing.
  const thresholdMinutes =
    Number(env?.PUBLIC_SYNC_LAG_THRESHOLD_MINUTES) ||
    DEFAULT_SYNC_LAG_THRESHOLD_MINUTES;

  // The lag increases while the indexer does not sync, but the synced slot
  // does not change. A clock tick makes the component render again, so the
  // hook calculates the lag again.
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), MS_PER_MINUTE);

    return () => clearInterval(interval);
  }, []);

  // After a failed refetch, the query keeps the last data. Do not use that
  // old slot, because the API is down, not the indexer.
  if (isError) {
    return;
  }

  return getSyncLag({
    chain,
    lastUpperSyncedSlot: appState?.syncState?.lastUpperSyncedSlot,
    thresholdMinutes,
  });
}
