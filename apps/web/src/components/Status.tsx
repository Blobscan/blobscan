import { api } from "~/api-client";
import { StatusBadge } from "./Badges/StatusBadge";

export function BlockStatus({ blockNumber }: { blockNumber: number }) {
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
}
