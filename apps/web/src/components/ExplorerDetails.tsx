import React from "react";
import { ClockIcon } from "@heroicons/react/24/solid";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { formatTtl } from "@blobscan/dates";
import { convertWei, prettyFormatWei } from "@blobscan/eth-format";
import { getNetworkBlobConfigBySlot } from "@blobscan/network-blob-config";

import { api } from "~/api-client";
import { useEnv } from "~/providers/Env";
import { capitalize, formatNumber, formatUsd } from "~/utils";

type ExplorerDetailsItemProps = {
  name: string;
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

type ExplorerDetailsProps = {
  placement: "top" | "footer";
};

export function ExplorerDetails({ placement }: ExplorerDetailsProps) {
  const { data: syncStateData } = api.syncState.getState.useQuery();
  const { data: blobStoragesState } = api.blobStoragesState.getState.useQuery();
  const { data: ethPriceData } = api.ethPrice.getByTimestamp.useQuery();
  const { data: latestBlock } = api.block.getLatestBlock.useQuery();

  const { env } = useEnv();

  const networkConfig =
    latestBlock && env?.PUBLIC_NETWORK_NAME
      ? getNetworkBlobConfigBySlot(env.PUBLIC_NETWORK_NAME, latestBlock.slot)
      : undefined;
  const blobGasPrice = latestBlock?.blobGasPrice.toString();
  const blobPrice =
    blobGasPrice && networkConfig
      ? BigInt(blobGasPrice) * networkConfig.gasPerBlob
      : undefined;
  const ethBlobPrice = blobPrice
    ? convertWei(blobPrice.toString(), "ether")
    : undefined;
  const blobUsdPrice =
    ethBlobPrice && ethPriceData
      ? Number(ethBlobPrice) * ethPriceData.usdPrice
      : undefined;

  const explorerDetailsItems: ExplorerDetailsItemProps[] = [];

  if (placement === "top") {
    explorerDetailsItems.push(
      {
        name: "Network",
        value: env ? (
          capitalize(env.PUBLIC_NETWORK_NAME)
        ) : (
          <Skeleton height={14} width={48} />
        ),
      },
      {
        name: "ETH Price",
        value: ethPriceData ? (
          <div>
            {formatUsd(ethPriceData.usdPrice, { maximumFractionDigits: 2 })}
          </div>
        ) : (
          <Skeleton height={14} width={50} />
        ),
      },
      {
        name: "Blob Price",
        value:
          blobPrice && blobUsdPrice ? (
            <div className="flex items-center gap-1">
              <div>{formatUsd(blobUsdPrice)}</div>
              <div className="flex">
                (
                {prettyFormatWei(blobPrice, {
                  numberFormatOpts: {
                    notation: "standard",
                    maximumFractionDigits: 4,
                  },
                })}
                )
              </div>
            </div>
          ) : (
            <Skeleton height={14} width={120} />
          ),
      }
    );
  }

  if (placement === "footer") {
    explorerDetailsItems.push({
      name: "Last synced slot",
      value: syncStateData
        ? formatNumber(syncStateData.lastUpperSyncedSlot ?? 0)
        : undefined,
    });
  }

  if (
    placement === "footer" &&
    blobStoragesState &&
    blobStoragesState.swarmDataTTL
  ) {
    explorerDetailsItems.push({
      name: "Swarm blob data expiry",
      value: formatTtl(blobStoragesState.swarmDataTTL),
      icon: <ClockIcon className="h-4 w-4" />,
    });
  }

  return (
    <div className="flex flex-col flex-wrap items-center justify-center gap-2 align-middle text-xs text-contentSecondary-light dark:text-contentSecondary-dark sm:h-4 sm:flex-row">
      {explorerDetailsItems.map(({ name, value, icon }, i) => {
        return (
          <div key={name} className="flex items-center gap-2">
            <ExplorerDetailsItem name={name} value={value} icon={icon} />
            <span className="hidden sm:flex">
              {i < explorerDetailsItems.length - 1 ? "･" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
