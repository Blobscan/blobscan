import React from "react";
import { ClockIcon } from "@heroicons/react/24/solid";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { api } from "~/api-client";
import { env } from "~/env.mjs";
import { capitalize, formatNumber, formatTtl } from "~/utils";

type InfoBarItemProps = {
  name: React.ReactNode;
  value: React.ReactNode;
};

function ExplorerDetailsItem({ name, value }: InfoBarItemProps) {
  return (
    <div className="space-x-1">
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

  return (
    <div className="flex h-4 gap-2 align-middle text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
      <ExplorerDetailsItem
        name="Network"
        value={capitalize(env.NEXT_PUBLIC_NETWORK_NAME)}
      />
      ･
      <ExplorerDetailsItem
        name="Last synced slot"
        value={
          syncStateData
            ? formatNumber(syncStateData.lastUpperSyncedSlot ?? 0)
            : undefined
        }
      />
      {blobStoragesState?.swarmDataTTL && (
        <>
          ･
          <ClockIcon />
          <ExplorerDetailsItem
            name="Swarm data expiry"
            value={formatTtl(blobStoragesState.swarmDataTTL)}
          />
        </>
      )}
    </div>
  );
}
