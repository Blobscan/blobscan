import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

import { formatIndexerLag, getIndexerLag } from "~/utils/indexer-lag";
import { useChain } from "~/hooks/useChain";
import { useAppState } from "~/providers/AppState";
import Banner from "./Banner";

export default function IndexerLagBanner() {
  const { appState, isError, dataUpdatedAt } = useAppState();
  const chain = useChain();

  // After a failed refetch, the query keeps the last data. Do not use that
  // old slot, because the API is down, not the indexer.
  const lag = isError
    ? undefined
    : getIndexerLag({
        chain,
        lastUpperSyncedSlot: appState?.syncState?.lastUpperSyncedSlot,
        // Measure the lag at the time of the fetch, not now. When a tab
        // comes back from the background, the slot is old until the refetch
        // is complete. A lag from the current time then shows the banner for
        // a short time. The periodic refetch updates this time, so the lag
        // still increases while the indexer does not sync.
        measuredAt: dataUpdatedAt,
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
        <span className="font-semibold">~{formatIndexerLag(lag.lagMs)}</span>{" "}
        behind the chain. Recent data can be missing.
      </p>
    </Banner>
  );
}
