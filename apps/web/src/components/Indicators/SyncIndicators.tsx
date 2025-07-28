import type { FC } from "react";
import { ClockIcon } from "@heroicons/react/24/solid";

import { formatTtl } from "@blobscan/dates";

import { api } from "~/api-client";
import { formatNumber } from "~/utils";
import type { IndicatorProps } from "../Indicator";
import { Indicator } from "../Indicator";

export const SyncIndicators: FC = function () {
  const { data } = api.state.getAppState.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
  const state = data?.syncState;

  const items: IndicatorProps[] = [
    {
      name: "Last synced slot",
      value: state ? formatNumber(state.lastUpperSyncedSlot ?? 0) : undefined,
    },
  ];

  if (state && state.swarmDataTTL) {
    items.push({
      name: "Swarm blob data expiry",
      value: formatTtl(state.swarmDataTTL),
      icon: <ClockIcon className="h-4 w-4" />,
    });
  }

  return (
    <div className="flex flex-col items-center gap-1 text-xs md:flex-row">
      {items.map((i) => (
        <Indicator key={i.name} {...i} />
      ))}
    </div>
  );
};
