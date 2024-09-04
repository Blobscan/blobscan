import type { FC } from "react";

import { formatWei, findBestUnit } from "@blobscan/eth-units";
import type { EtherUnit } from "@blobscan/eth-units";

type Props = {
  amount: bigint | number | string;
  toUnit?: EtherUnit;
};

export const EtherUnitDisplay: FC<Props> = ({ amount, toUnit }) => {
  toUnit = toUnit ? toUnit : findBestUnit(amount);
  return <div>{formatWei(amount, toUnit)}</div>;
};
