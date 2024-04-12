import React from "react";
import { ClockIcon } from "@heroicons/react/24/solid";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { api } from "~/api-client";
import { env } from "~/env.mjs";
import { capitalize, formatNumber, formatTtl } from "~/utils";

type ExplorerDetailsItemProps = {
  name: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
};

function ExplorerDetailsItem({
  name,
  value,
  icon = null,
}: ExplorerDetailsItemProps) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span>{name}:</span>
      {value !== undefined ? (
        <span className="font-semibold">{value}</span>
      ) : (
        <Skeleton width={50} />
      )}
    </div>
  );
}

export function ExplorerDetails() {
  const { data: syncStateData } = api.syncState.getState.useQuery();
  const { data: blobStoragesState } = api.blobStoragesState.getState.useQuery();
  const explorerDetailsItems = [
    { name: "Network", value: capitalize(env.NEXT_PUBLIC_NETWORK_NAME) },
    {
      name: "Last synced slot",
      value: syncStateData
        ? formatNumber(syncStateData.lastUpperSyncedSlot ?? 0)
        : undefined,
    },
    {
      name: "Swarm blob data expiry",
      value: blobStoragesState
        ? blobStoragesState.swarmDataTTL
          ? formatTtl(blobStoragesState.swarmDataTTL)
          : null
        : undefined,
      icon: <ClockIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="sm:fle flex w-full flex-wrap items-center justify-center gap-2 align-middle text-xs text-contentSecondary-light dark:text-contentSecondary-dark sm:h-4 sm:justify-start">
      {explorerDetailsItems.map(({ name, value, icon }, i) => {
        return (
          <div key={name} className="flex items-center gap-2">
            <ExplorerDetailsItem name={name} value={value} icon={icon} />
            {i < explorerDetailsItems.length - 1 ? "･" : ""}
          </div>
        );
      })}
    </div>
  );
}
