import { useEffect, useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

import { MS_PER_MINUTE } from "~/utils/date";
import {
  DEFAULT_SYNC_LAG_THRESHOLD_MINUTES,
  formatSyncLag,
  getSyncLag,
} from "~/utils/sync-lag";
import { useChain } from "~/hooks/useChain";
import { useAppState } from "~/providers/AppState";
import { useEnv } from "~/providers/Env";
import Banner from "./Banner";

export default function SyncLagBanner() {
  const { env } = useEnv();
  const { appState, isError } = useAppState();
  const chain = useChain();
  // When the validation of the env vars is off, the value can be a string or
  // it can be missing.
  const thresholdMinutes =
    Number(env?.PUBLIC_SYNC_LAG_THRESHOLD_MINUTES) ||
    DEFAULT_SYNC_LAG_THRESHOLD_MINUTES;

  // The lag increases while the indexer does not sync, but the synced slot
  // does not change. A clock tick makes the banner render again, so it
  // calculates the lag again.
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), MS_PER_MINUTE);

    return () => clearInterval(interval);
  }, []);

  // After a failed refetch, the query keeps the last data. Do not use that
  // old slot, because the API is down, not the indexer.
  const lag = isError
    ? undefined
    : getSyncLag({
        chain,
        lastUpperSyncedSlot: appState?.syncState?.lastUpperSyncedSlot,
        thresholdMinutes,
      });

  if (!lag?.isOutOfSync) {
    return null;
  }

  return (
    <Banner
      variant="warning"
      role="status"
      icon={
        <ExclamationTriangleIcon
          className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
      }
    >
      <p>
        Blobscan is{" "}
        <span className="font-semibold">~{formatSyncLag(lag.lagMs)}</span>{" "}
        behind the chain. Recent data can be missing.
      </p>
    </Banner>
  );
}
