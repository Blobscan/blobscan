import type { FC } from "react";

import { api } from "~/api-client";
import { StatusBadge } from "./StatusBadge";

interface BlockStatusBadgeProps {
  blockNumber: number;
}

export const BlockStatusBadge: FC<BlockStatusBadgeProps> = function ({
  blockNumber,
}) {
  const { data } = api.state.getAppState.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const lastFinalizedBlock = data?.syncState?.lastFinalizedBlock;

  if (typeof lastFinalizedBlock === "undefined") {
    return;
  }

  return (
    <StatusBadge
      status={blockNumber > lastFinalizedBlock ? "unfinalized" : "finalized"}
    />
  );
};
