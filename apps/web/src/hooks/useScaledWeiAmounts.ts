import { useMemo } from "react";

import type { EtherUnit } from "@blobscan/eth-units";
import { convertWei, findBestUnit } from "@blobscan/eth-units";

type ScaledWeiAmounts = {
  unit: EtherUnit;
  scaledValues: string[] | undefined;
};

export function useScaledWeiAmounts(arr?: number[], toUnit?: EtherUnit) {
  return useMemo<ScaledWeiAmounts>(() => {
    if (!arr) {
      return {
        unit: "wei",
        scaledValues: undefined,
      };
    }

    const unit = toUnit ? toUnit : findBestUnit(Math.max(...arr));

    return {
      unit,
      scaledValues: arr.map((item) => convertWei(item, unit)),
    };
  }, [arr, toUnit]);
}
