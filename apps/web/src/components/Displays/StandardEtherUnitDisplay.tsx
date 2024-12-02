import type { FormatOptions } from "@blobscan/eth-format";
import { formatWei } from "@blobscan/eth-format";

import { EtherUnitDisplay } from "./EtherUnitDisplay";

type StandardEtherUnitDisplayProps = {
  amount: bigint;
  opts?: FormatOptions;
};

export const StandardEtherUnitDisplay = ({
  amount,
  opts = {},
}: StandardEtherUnitDisplayProps) => {
  return (
    <div className="flex items-center justify-start gap-1">
      <EtherUnitDisplay amount={amount} toUnit="ether" opts={opts} />
      <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
        (
        {formatWei(amount, {
          toUnit: "Gwei",
          ...opts,
        })}
        )
      </span>
    </div>
  );
};
