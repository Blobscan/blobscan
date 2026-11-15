import type { FC } from "react";
import { formatEther } from "viem";

import type { FormatOptions } from "@blobscan/eth-format";
import { formatWei } from "@blobscan/eth-format";

import { formatEthFiatPrice } from "~/utils";

type EtherDisplayProps = {
  weiAmount: bigint;
  usdAmount?: string;
  ethUsdPrice?: number | null;
  opts?: FormatOptions;
};

export const EtherDisplay: FC<EtherDisplayProps> = ({
  weiAmount,
  usdAmount,
  ethUsdPrice,
  opts = {},
}) => {
  const displayedUsdAmount =
    usdAmount ??
    (ethUsdPrice != null
      ? (Number(formatEther(weiAmount)) * ethUsdPrice).toString()
      : undefined);

  return (
    <div className="flex items-center justify-start gap-1 max-sm:flex-col max-sm:items-start max-sm:gap-0">
      {formatWei(weiAmount, { toUnit: "ether", ...opts })}
      {displayedUsdAmount != null && (
        <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
          ({formatEthFiatPrice(displayedUsdAmount)})
        </span>
      )}
    </div>
  );
};
