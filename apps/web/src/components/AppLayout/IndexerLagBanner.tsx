import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

import { formatIndexerLag, getAppStateIndexerLag } from "~/utils/indexer-lag";
import { useChain } from "~/hooks/useChain";
import { useAppState } from "~/providers/AppState";
import Banner from "./Banner";

export default function IndexerLagBanner() {
  const { appState, isError, dataUpdatedAt } = useAppState();
  const chain = useChain();
  const lag = getAppStateIndexerLag({
    chain,
    appState,
    isError,
    dataUpdatedAt,
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
