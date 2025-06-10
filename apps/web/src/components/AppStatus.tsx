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
import { DeltaPercentageChange } from "./DeltaPercentage";
import { FiatDisplay } from "./Displays/FiatDisplay";
import { Icon } from "./Icon";
import { IndicatorProps, IndicatorsStrip } from "./Indicators";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export function TopAppStatus() {
  const { env } = useEnv();
  const { data } = api.state.getAppState.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
  const { ethPrices, blocks } = data || {};
  const { usdPrice: latestUsdPrice, timestamp: latestUsdPriceTimestamp } =
    ethPrices?.latest || {};
  const { usdPrice: past24hUsdPrice } = ethPrices?.past24h || {};
  const networkConfig =
    blocks?.latest && env?.PUBLIC_NETWORK_NAME
      ? getNetworkBlobConfigBySlot(env.PUBLIC_NETWORK_NAME, blocks.latest.slot)
      : undefined;
  const past24hBlobGasPrice = blocks?.past24h?.blobGasPrice
    ? BigInt(blocks.past24h.blobGasPrice.toString())
    : undefined;
  const latestBlobGasPrice = blocks?.latest?.blobGasPrice
    ? BigInt(blocks.latest.blobGasPrice.toString())
    : undefined;
  const latestBlobGasUsdPrice =
    latestBlobGasPrice && latestUsdPrice
      ? Number(convertWei(latestBlobGasPrice, "ether")) * latestUsdPrice
      : undefined;
  const blobPrice =
    latestBlobGasPrice && networkConfig
      ? BigInt(latestBlobGasPrice) * networkConfig.gasPerBlob
      : undefined;
  const ethBlobPrice = blobPrice
    ? convertWei(blobPrice.toString(), "ether")
    : undefined;
  const blobUsdPrice =
    ethBlobPrice && latestUsdPrice
      ? Number(ethBlobPrice) * latestUsdPrice
      : undefined;
  const isOutdated =
    latestUsdPriceTimestamp &&
    dayjs().diff(latestUsdPriceTimestamp, "minutes") > 5;

  return (
    <IndicatorsStrip
      indicators={[
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
          value: latestUsdPrice ? (
            <div className="flex items-center gap-1">
              <FiatDisplay amount={latestUsdPrice} />

              {past24hUsdPrice ? (
                <>
                  <Tooltip>
                    <TooltipTrigger>
                      <DeltaPercentageChange
                        initialValue={past24hUsdPrice}
                        finalValue={latestUsdPrice}
                      />
                    </TooltipTrigger>
                    <TooltipContent>Last 24 hours changes</TooltipContent>
                  </Tooltip>
                </>
              ) : undefined}
              {isOutdated && (
                <>
                  <Tooltip>
                    <TooltipContent>
                      Outdated price (last updated{" "}
                      {latestUsdPriceTimestamp
                        ? formatTimestamp(latestUsdPriceTimestamp, true)
                        : ""}
                      )
                    </TooltipContent>
                    <TooltipTrigger>
                      <ExclamationTriangleIcon className="h-3 w-3 text-yellow-600 dark:text-yellow-300" />
                    </TooltipTrigger>
                  </Tooltip>
                </>
              )}
            </div>
          ) : latestUsdPrice === null ? (
            "-"
          ) : undefined,
        },
        {
          name: "Blob Gas Price",
          icon: <Icon src={GasIcon} />,
          value: latestBlobGasPrice && (
            <div>
              {prettyFormatWei(latestBlobGasPrice, {
                numberFormatOpts: {
                  notation: "standard",
                  maximumFractionDigits: 4,
                },
              })}{" "}
              {past24hBlobGasPrice ? (
                <>
                  <Tooltip>
                    <TooltipTrigger>
                      <DeltaPercentageChange
                        initialValue={latestBlobGasPrice}
                        finalValue={past24hBlobGasPrice}
                      />
                    </TooltipTrigger>
                    <TooltipContent>Last 24 hours changes</TooltipContent>
                  </Tooltip>
                </>
              ) : undefined}
            </div>
          ),
          secondaryValue: latestBlobGasUsdPrice && (
            <FiatDisplay amount={latestBlobGasUsdPrice} />
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
      ]}
    />
  );
}

export const BottomAppStatus: FC = function () {
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

  return <IndicatorsStrip indicators={items} />;
};
