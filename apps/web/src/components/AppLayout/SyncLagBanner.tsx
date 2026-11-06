import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

import { formatSyncLag } from "~/utils/sync-lag";
import { useSyncLag } from "~/hooks/useSyncLag";

export default function SyncLagBanner() {
  const lag = useSyncLag();

  if (!lag?.isOutOfSync) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-x-2 bg-amber-100 px-6 py-2.5 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
    >
      <ExclamationTriangleIcon
        className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <p className="leading-6">
        Blobscan is{" "}
        <span className="font-semibold">~{formatSyncLag(lag.lagMs)}</span>{" "}
        behind the chain. Recent data can be missing.
      </p>
    </div>
  );
}
