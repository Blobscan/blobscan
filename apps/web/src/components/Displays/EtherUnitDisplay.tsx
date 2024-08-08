import type { FC } from "react";

import { formatWei, findBestUnit, EtherUnit } from "@blobscan/eth-units";

type Props = {
  wei: bigint;
  toUnit?: EtherUnit;
};

export const EtherUnitDisplay: FC<Props> = ({ wei, toUnit }) => {
  toUnit = toUnit ? toUnit : findBestUnit(wei);
  return <div>{formatWei(wei, toUnit)}</div>;
};
