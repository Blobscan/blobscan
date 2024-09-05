import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";

import { api } from "~/api-client";
import { StatusBadge } from "./Badges/StatusBadge";

export function BlockStatus({ blockNumber }: { blockNumber: number }) {
  const { data: syncState } = api.syncState.getState.useQuery();

  if (!syncState || typeof syncState.lastFinalizedBlock !== "number") {
    return;
  }

  if (blockNumber <= syncState.lastFinalizedBlock) {
    return (
      <StatusBadge variant="green">
        <CheckCircleIcon className="h-4 w-4" />
        Finalized
      </StatusBadge>
    );
  }

  return (
    <StatusBadge variant="gray">
      <ClockIcon className="h-4 w-4" />
      Unfinalized
    </StatusBadge>
  );
}
