import type { FC } from "react";

import { formatWei } from "@blobscan/eth-format";
import type { EtherUnit, FormatOptions } from "@blobscan/eth-format";

type Props = {
  amount: bigint | number | string;
  toUnit?: EtherUnit;
  opts?: FormatOptions;
};

export const EtherUnitDisplay: FC<Props> = ({ amount, toUnit, opts = {} }) => {
  return (
    <div>
      {formatWei(amount, {
        toUnit,
        ...opts,
      })}
    </div>
  );
};
