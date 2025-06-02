import React, { FC } from "react";
import { ClockIcon } from "@heroicons/react/24/solid";

import "react-loading-skeleton/dist/skeleton.css";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import Skeleton from "react-loading-skeleton";

import { formatTtl } from "@blobscan/dates";
import dayjs from "@blobscan/dayjs";
import { convertWei, prettyFormatWei } from "@blobscan/eth-format";
import { getNetworkBlobConfigBySlot } from "@blobscan/network-blob-config";

import { api } from "~/api-client";
import EthereumIcon from "~/icons/ethereum.svg";
import GasIcon from "~/icons/gas.svg";
import { useEnv } from "~/providers/Env";
import { capitalize, formatNumber, formatTimestamp } from "~/utils";
import { FiatDisplay } from "./Displays/FiatDisplay";
import { Icon } from "./Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

type InfoItemProps = {
  name: string;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
  icon?: React.ReactNode;
};

function InfoItem({ name, value, secondaryValue, icon = null }: InfoItemProps) {
  return (
    <div className="relative flex items-center gap-1">
      {icon}
      <span className="text-nowrap">{name}:</span>
      {value !== undefined ? (
        <div className="flex items-center gap-1">
          <div className="text-nowrap text-content-light dark:text-content-dark">
            {value}
          </div>
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

const NetworkInfo: FC<{ items: InfoItemProps[] }> = function ({ items }) {
  return (
    <div className="flex w-full flex-row items-center justify-start gap-2 overflow-scroll align-middle text-xs text-contentSecondary-light dark:text-contentSecondary-dark sm:h-4 sm:overflow-auto">
      {items.map((props, i) => {
        return (
          <div key={props.name} className="flex flex-row items-center gap-2">
            <InfoItem {...props} />
            <span className="flex">{i < items.length - 1 ? "･" : ""}</span>
          </div>
        );
      })}
    </div>
  );
};

export function TopNetworkInfo() {
  const { env } = useEnv();
  const { data: ethPriceData } = api.ethPrice.getByTimestamp.useQuery();
  const { data: latestBlock } = api.block.getLatestBlock.useQuery();
  const { usdPrice, timestamp } = ethPriceData || {};
  const networkConfig =
    latestBlock && env?.PUBLIC_NETWORK_NAME
      ? getNetworkBlobConfigBySlot(env.PUBLIC_NETWORK_NAME, latestBlock.slot)
      : undefined;
  const blobGasPrice = latestBlock?.blobGasPrice.toString();
  const blobGasUsdPrice =
    blobGasPrice && usdPrice
      ? Number(convertWei(blobGasPrice, "ether")) * usdPrice
      : undefined;
  const blobPrice =
    blobGasPrice && networkConfig
      ? BigInt(blobGasPrice) * networkConfig.gasPerBlob
      : undefined;
  const ethBlobPrice = blobPrice
    ? convertWei(blobPrice.toString(), "ether")
    : undefined;
  const blobUsdPrice =
    ethBlobPrice && usdPrice ? Number(ethBlobPrice) * usdPrice : undefined;
  const isOutdated = timestamp && dayjs().diff(timestamp, "minutes") > 5;

  const explorerDetailsItems: InfoItemProps[] = [
    {
      name: "Network",
      value: env ? (
        capitalize(env.PUBLIC_NETWORK_NAME)
      ) : (
        <Skeleton height={14} width={48} />
      ),
    },
    {
      icon: <Icon src={EthereumIcon} />,
      name: "ETH Price",
      value: usdPrice && (
        <div className="flex items-center gap-1">
          <FiatDisplay amount={usdPrice} />
          {isOutdated && (
            <Tooltip>
              <TooltipContent>
                Outdated price (last updated{" "}
                {timestamp ? formatTimestamp(timestamp, true) : ""})
              </TooltipContent>
              <TooltipTrigger>
                <ExclamationTriangleIcon className="h-3 w-3 text-yellow-600 dark:text-yellow-300" />
              </TooltipTrigger>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      name: "Blob Gas Price",
      icon: <Icon src={GasIcon} />,
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
    },
  ];

  return <NetworkInfo items={explorerDetailsItems} />;
}

export const BottomNetworkInfo: FC = function () {
  const { data: syncStateData } = api.syncState.getState.useQuery();
  const { data: blobStoragesState } = api.blobStoragesState.getState.useQuery();
  const items: InfoItemProps[] = [
    {
      name: "Last synced slot",
      value: syncStateData
        ? formatNumber(syncStateData.lastUpperSyncedSlot ?? 0)
        : undefined,
    },
  ];

  if (blobStoragesState && blobStoragesState.swarmDataTTL) {
    items.push({
      name: "Swarm blob data expiry",
      value: formatTtl(blobStoragesState.swarmDataTTL),
      icon: <ClockIcon className="h-4 w-4" />,
    });
  }

  return <NetworkInfo items={items} />;
};
