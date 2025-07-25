import type { FC } from "react";

import type { FormatOptions } from "@blobscan/eth-format";
import { formatWei } from "@blobscan/eth-format";

import { formatEthFiatPrice } from "~/utils";
import { Separator } from "../Separator";

type EtherWithGweiDisplayProps = {
  amount: bigint;
  usdAmount?: string;
  opts?: FormatOptions;
};

export const EtherWithGweiDisplay: FC<EtherWithGweiDisplayProps> = ({
  amount,
  usdAmount,
  opts = {},
}) => {
  return (
    <div className="flex items-center justify-start gap-1 max-sm:flex-col max-sm:items-start max-sm:gap-0">
      {formatWei(amount, { toUnit: "ether", ...opts })}
      <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
        (
        {formatWei(amount, {
          toUnit: "Gwei",
          ...opts,
        })}
        )
      </span>
      {usdAmount && (
        <>
          <Separator />
          <span className="text-contentSecondary-light dark:text-contentSecondary-dark">
            {formatEthFiatPrice(usdAmount)}
          </span>
        </>
      )}
    </div>
  );
};
