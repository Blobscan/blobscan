import type { FC } from "react";

import type { FormatOptions } from "@blobscan/eth-format";
import { formatWei } from "@blobscan/eth-format";

import { formatEthFiatPrice } from "~/utils";

type EtherDisplayProps = {
  weiAmount: bigint;
  usdAmount?: string;
  opts?: FormatOptions;
};

export const EtherDisplay: FC<EtherDisplayProps> = ({
  weiAmount,
  usdAmount,
  opts = {},
}) => {
  return (
    <div className="flex items-center justify-start gap-1 max-sm:flex-col max-sm:items-start max-sm:gap-0">
      {formatWei(weiAmount, { toUnit: "ether", ...opts })}
      {usdAmount && (
        <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
          ({formatEthFiatPrice(usdAmount)})
        </span>
      )}
    </div>
  );
};
