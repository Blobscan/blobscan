import type { FC } from "react";

import { formatWei, findBestUnit, EtherUnit } from "@blobscan/eth-units";

type Props = {
  amount: bigint;
  toUnit?: EtherUnit;
};

export const EtherUnitDisplay: FC<Props> = ({ amount, toUnit }) => {
  toUnit = toUnit ? toUnit : findBestUnit(amount);
  return <div>{formatWei(amount, toUnit)}</div>;
};
