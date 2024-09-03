import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";

import { api } from "~/api-client";
import { Indicator } from "./Indicator";

function StatusIndicator({ finalized }: { finalized: boolean }) {
  return (
    <Indicator variant={finalized ? "green" : "gray"}>
      <div className="flex items-center justify-center gap-1">
        {finalized ? (
          <>
            <CheckCircleIcon className="h-4 w-4" />
            Finalized
          </>
        ) : (
          <>
            <ClockIcon className="h-4 w-4" />
            Unfinalized
          </>
        )}
      </div>
    </Indicator>
  );
}

export function BlockStatus({ blockNumber }: { blockNumber: number }) {
  const { data: syncState } = api.syncState.getState.useQuery();

  if (!syncState || typeof syncState.lastFinalizedBlock !== "number") {
    return;
  }

  return (
    <StatusIndicator finalized={blockNumber <= syncState.lastFinalizedBlock} />
  );
}
