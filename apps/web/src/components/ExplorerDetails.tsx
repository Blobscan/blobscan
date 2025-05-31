import React from "react";
import { ClockIcon } from "@heroicons/react/24/solid";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { formatTtl } from "@blobscan/dates";
import { convertWei, prettyFormatWei } from "@blobscan/eth-format";
import { getNetworkBlobConfigBySlot } from "@blobscan/network-blob-config";

import { api } from "~/api-client";
import GasIcon from "~/icons/gas.svg";
import { useEnv } from "~/providers/Env";
import { capitalize, formatNumber } from "~/utils";
import { FiatDisplay } from "./Displays/FiatDisplay";
import { Icon } from "./Icon";

type ExplorerDetailsItemProps = {
  name: string;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
  icon?: React.ReactNode;
};

function ExplorerDetailsItem({
  name,
  value,
  secondaryValue,
  icon = null,
}: ExplorerDetailsItemProps) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span>{name}:</span>
      {value !== undefined ? (
        <div className="flex items-center gap-1">
          <span className="text-content-light dark:text-content-dark">
            {value}
          </span>
          {secondaryValue && (
            <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
              ({secondaryValue})
            </span>
          )}
        </div>
      ) : (
        <Skeleton width={75} />
      )}
    </div>
  );
}

type ExplorerDetailsProps = {
  placement: "top" | "footer";
};

export function ExplorerDetails({ placement }: ExplorerDetailsProps) {
  const { env } = useEnv();
  const { data: syncStateData } = api.syncState.getState.useQuery();
  const { data: blobStoragesState } = api.blobStoragesState.getState.useQuery();
  const { data: ethPriceData } = api.ethPrice.getByTimestamp.useQuery();
  const { data: latestBlock } = api.block.getLatestBlock.useQuery();
  const networkConfig =
    latestBlock && env?.PUBLIC_NETWORK_NAME
      ? getNetworkBlobConfigBySlot(env.PUBLIC_NETWORK_NAME, latestBlock.slot)
      : undefined;
  const blobGasPrice = latestBlock?.blobGasPrice.toString();
  const blobGasUsdPrice =
    blobGasPrice && ethPriceData
      ? Number(convertWei(blobGasPrice, "ether")) * ethPriceData.usdPrice
      : undefined;
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
        value: ethPriceData && <FiatDisplay amount={ethPriceData.usdPrice} />,
      },
      {
        name: "Blob Gas Price",
        icon: <Icon src={GasIcon} size="md" />,
        value: blobGasPrice && (
          <span>
            {prettyFormatWei(blobGasPrice, {
              numberFormatOpts: {
                notation: "standard",
                maximumFractionDigits: 4,
              },
            })}
          </span>
        ),
        secondaryValue: blobGasUsdPrice && (
          <FiatDisplay amount={blobGasUsdPrice} />
        ),
      },
      {
        name: "Blob Price",
        value: blobPrice && (
          <span>
            {prettyFormatWei(blobPrice, {
              numberFormatOpts: {
                notation: "standard",
                maximumFractionDigits: 4,
              },
            })}
          </span>
        ),
        secondaryValue: blobUsdPrice && <FiatDisplay amount={blobUsdPrice} />,
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
      {explorerDetailsItems.map((props, i) => {
        return (
          <div key={props.name} className="flex items-center gap-2">
            <ExplorerDetailsItem {...props} />
            <span className="hidden sm:flex">
              {i < explorerDetailsItems.length - 1 ? "･" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
