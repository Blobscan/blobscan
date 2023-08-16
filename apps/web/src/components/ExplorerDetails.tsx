import React from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { api } from "~/api-client";
import { env } from "~/env.mjs";

type InfoBarItemProps = {
  name: React.ReactNode;
  value: React.ReactNode;
};

function ExplorerDetailsItem({ name, value }: InfoBarItemProps) {
  return (
    <div className="space-x-1">
      <span>{name}:</span>
      {typeof value !== undefined ? (
        <span className="font-semibold">{value}</span>
      ) : (
        <Skeleton width={50} />
      )}
    </div>
  );
}

export function ExplorerDetails() {
  const { data: syncStateData } = api.syncState.getSyncState.useQuery();

  return (
    <div className="flex h-4 gap-2 align-middle text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
      <ExplorerDetailsItem
        name="Network"
        value={env.NEXT_PUBLIC_NETWORK_NAME}
      />
      ･
      <ExplorerDetailsItem
        name="Last synced slot"
        value={syncStateData?.lastSlot}
      />
    </div>
  );
}
