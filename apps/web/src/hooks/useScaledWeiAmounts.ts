import { useMemo } from "react";

import type { EtherUnit } from "@blobscan/eth-format";
import { convertWei, findBestUnit } from "@blobscan/eth-format";

type ScaledWeiAmounts = {
  unit: EtherUnit;
  scaledValues?: string[];
};

export function useScaledWeiAmounts(arr?: number[], toUnit?: EtherUnit) {
  return useMemo<ScaledWeiAmounts>(() => {
    if (!arr) {
      return {
        unit: "wei",
      };
    }

    const unit = toUnit ?? findBestUnit(Math.max(...arr));

    return {
      unit,
      scaledValues: arr.map((item) => convertWei(item, unit)),
    };
  }, [arr, toUnit]);
}
