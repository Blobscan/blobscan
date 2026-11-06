import { useEffect, useState } from "react";

import { getChain } from "@blobscan/chains";

import { getIndexerLag } from "~/utils/indexer-lag";
import { useAppState } from "~/providers/AppState";
import { useEnv } from "~/providers/Env";

const DEFAULT_THRESHOLD_MINUTES = 5;
const CLOCK_TICK_MS = 60_000;

function findChain(networkName: string) {
  // Networks without a chain config (e.g. devnet) have no slot clock.
  try {
    return getChain(networkName);
  } catch {
    return;
  }
}

/**
 * Returns how far the indexer is behind the chain, or undefined when the lag
 * cannot be measured.
 */
export function useIndexerLag() {
  const { env } = useEnv();
  const { appState } = useAppState();
  const lastUpperSyncedSlot = appState?.syncState?.lastUpperSyncedSlot;
  const networkName = env?.PUBLIC_NETWORK_NAME;
  const thresholdMinutes =
    Number(env?.PUBLIC_SYNC_LAG_THRESHOLD_MINUTES) || DEFAULT_THRESHOLD_MINUTES;

  // The lag grows while the indexer is stalled, even when the synced slot
  // does not change. A clock tick makes the component render again, so the
  // hook calculates the lag again.
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), CLOCK_TICK_MS);

    return () => clearInterval(interval);
  }, []);

  return getIndexerLag({
    chain: networkName ? findChain(networkName) : undefined,
    lastUpperSyncedSlot,
    thresholdMinutes,
  });
}
