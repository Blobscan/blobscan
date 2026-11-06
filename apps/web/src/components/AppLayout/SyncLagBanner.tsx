import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

import { formatSyncLag } from "~/utils/sync-lag";
import { useSyncLag } from "~/hooks/useSyncLag";
import Banner from "./Banner";

export default function SyncLagBanner() {
  const lag = useSyncLag();

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
