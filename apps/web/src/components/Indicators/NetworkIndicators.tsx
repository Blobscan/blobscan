import React, { Fragment } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import Skeleton from "react-loading-skeleton";

import dayjs from "@blobscan/dayjs";
import { convertWei, prettyFormatWei } from "@blobscan/eth-format";

import { useChain } from "~/hooks/useChain";
import BlobIcon from "~/icons/blob.svg";
import EthereumIcon from "~/icons/ethereum.svg";
import GasIcon from "~/icons/gas.svg";
import { useAppState } from "~/providers/AppState";
import { useEnv } from "~/providers/Env";
import { capitalize, formatTimestamp } from "~/utils";
import { DeltaPercentageChange } from "../DeltaPercentage";
import { FiatDisplay } from "../Displays/FiatDisplay";
import { Icon } from "../Icon";
import type { IndicatorProps } from "../Indicator";
import { Indicator } from "../Indicator";
import { Scrollable } from "../Scrollable";
import { Separator } from "../Separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip";

export function NetworkIndicators() {
  const { env } = useEnv();
  const { appState } = useAppState();
  const chain = useChain();

  const blocks = appState?.blocks;
  const latestSlot = blocks?.latest?.slot;
  const blobParams =
    chain && latestSlot
      ? chain.getActiveForkBySlot(latestSlot).blobParams
      : undefined;
  const ethPrices = appState?.ethPrices;
  const latestEthPrice = ethPrices?.latest;
  const { usdPrice: latestUsdPrice, timestamp: latestUsdPriceTimestamp } =
    latestEthPrice ||
    (latestEthPrice === null
      ? {
          usdPrice: 0,
          timestamp: new Date(),
        }
      : {});
  const { usdPrice: past24hUsdPrice } = ethPrices?.past24h || {};
  const past24hBlobGasPrice = blocks?.past24h?.blobGasPrice;
  const latestBlobGasPrice = blocks?.latest?.blobGasPrice;
  const latestBlobGasUsdPrice =
    latestBlobGasPrice && latestUsdPrice !== undefined
      ? Number(convertWei(latestBlobGasPrice, "ether")) * latestUsdPrice
      : undefined;
  const blobPrice =
    latestBlobGasPrice && blobParams
      ? latestBlobGasPrice * blobParams.gasPerBlob
      : undefined;
  const ethBlobPrice = blobPrice
    ? convertWei(blobPrice.toString(), "ether")
    : undefined;
  const blobUsdPrice =
    ethBlobPrice && latestUsdPrice !== undefined
      ? Number(ethBlobPrice) * latestUsdPrice
      : undefined;
  const isOutdated =
    latestUsdPriceTimestamp &&
    dayjs().diff(latestUsdPriceTimestamp, "minutes") > 5;

  const indicators: IndicatorProps[] = [];

  if (env?.PUBLIC_NETWORK_NAME === "devnet") {
    indicators.push({
      name: "Network",
      value: env ? (
        capitalize(env.PUBLIC_NETWORK_NAME)
      ) : (
        <Skeleton height={14} width={48} />
      ),
    });
  }

  if (
    env?.PUBLIC_NETWORK_NAME === "mainnet" ||
    env?.PUBLIC_NETWORK_NAME === "gnosis"
  ) {
    indicators.push({
      icon: <Icon src={EthereumIcon} />,
      name: "ETH Price",
      value:
        latestUsdPrice !== undefined ? (
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
        ) : undefined,
    });
  }

  indicators.push(
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
                    initialValue={past24hBlobGasPrice}
                    finalValue={latestBlobGasPrice}
                  />
                </TooltipTrigger>
                <TooltipContent>Last 24 hours changes</TooltipContent>
              </Tooltip>
            </>
          ) : undefined}
        </div>
      ),
      secondaryValue: latestBlobGasUsdPrice !== undefined && (
        <FiatDisplay amount={latestBlobGasUsdPrice} />
      ),
    },
    {
      name: "Blob Price",
      icon: <Icon src={BlobIcon} />,
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
      secondaryValue: blobUsdPrice !== undefined && (
        <FiatDisplay amount={blobUsdPrice} />
      ),
    }
  );

  return (
    <Scrollable>
      <div className="flex w-full  gap-1 text-xs">
        {indicators.map((props, i) => (
          <Fragment key={props.name}>
            <Indicator {...props} />
            {i < indicators.length - 1 && <Separator />}
          </Fragment>
        ))}
      </div>
    </Scrollable>
  );
}
