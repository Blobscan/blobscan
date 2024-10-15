import type { FC } from "react";

import { formatWei, findBestUnit } from "@blobscan/eth-units";
import type { EtherUnit, FormatOptions } from "@blobscan/eth-units";

type Props = {
  amount: bigint | number | string;
  toUnit?: EtherUnit;
  opts?: FormatOptions;
};

export const EtherUnitDisplay: FC<Props> = ({ amount, toUnit, opts = {} }) => {
  toUnit = toUnit ? toUnit : findBestUnit(amount);

  return (
    <div>
      {formatWei(amount, toUnit, {
        displayUnit: true,
        ...opts,
      })}
    </div>
  );
};
