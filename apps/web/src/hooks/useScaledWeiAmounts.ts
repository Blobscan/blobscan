import { useMemo } from "react";

import type { EtherUnit } from "@blobscan/eth-format";
import { convertWei, findBestUnit } from "@blobscan/eth-format";

import { findBiggestValue } from "~/utils";

type NumericArray = number[] | bigint[] | string[];

type ScaledWeiAmounts<T extends NumericArray | NumericArrays> = {
  unit: EtherUnit;
  scaledValues?: T extends NumericArray
    ? string[]
    : {
        [K in keyof T]: T[K] extends { values: infer _V }
          ? Omit<T[K], "values"> & { values: string[] }
          : never;
      };
};

type NumericArrays =
  | { values: number[] }[]
  | { values: bigint[] }[]
  | { values: string[] }[];

function isNumericArrays(arr: unknown): arr is NumericArrays {
  return Array.isArray(arr) && arr.every((item) => Array.isArray(item.values));
}

export function useScaledWeiAmounts<T extends NumericArray | NumericArrays>(
  arr?: T,
  toUnit?: Exclude<EtherUnit, "wei">
): ScaledWeiAmounts<T> {
  return useMemo<ScaledWeiAmounts<T>>(() => {
    if (!arr?.length) {
      return {
        unit: "wei",
      };
    }

    let unit: EtherUnit;

    if (isNumericArrays(arr)) {
      if (!toUnit) {
        const biggestValues = arr.map((item) => findBiggestValue(item.values));
        const biggestValue = findBiggestValue(biggestValues as NumericArray);

        unit = findBestUnit(biggestValue);
      } else {
        unit = toUnit;
      }

      return {
        unit,
        scaledValues: arr.map((item) => ({
          ...item,
          values: item.values.map((value) => convertWei(value, unit)),
        })),
      } as ScaledWeiAmounts<T>;
    }

    unit = toUnit ?? findBestUnit(findBiggestValue(arr));

    return {
      unit,
      scaledValues: arr.map((item) => convertWei(item, unit)),
    } as ScaledWeiAmounts<T>;
  }, [arr, toUnit]);
}
