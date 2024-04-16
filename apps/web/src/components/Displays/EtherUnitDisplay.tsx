import type { FC } from "react";

import { formatWei } from "~/utils";
import type { EtherUnit } from "~/utils";

const ETHER_UNITS: EtherUnit[] = ["wei", "Gwei", "ether"];
const DEFAULT_UNIT_SCALE_FACTOR = 7;

type EtherUnitDisplayProps = {
  amount: bigint | number;
  toUnit?: EtherUnit;
  alternateUnit?: EtherUnit;
  unitScaleFactor?: number;
};

function getTargetUnit(
  weiAmount: EtherUnitDisplayProps["amount"],
  unitScaleFactor: number
) {
  const weiAmountString = weiAmount.toString();
  const weiAmountLength = weiAmountString.length;
  const targetUnitIndex = Math.floor(weiAmountLength / unitScaleFactor);

  return ETHER_UNITS[targetUnitIndex];
}

export const EtherUnitDisplay: FC<EtherUnitDisplayProps> = function ({
  amount,
  toUnit: toUnitProp,
  alternateUnit,
  unitScaleFactor = DEFAULT_UNIT_SCALE_FACTOR,
}) {
  const toUnit = toUnitProp ?? getTargetUnit(amount, unitScaleFactor);

  return (
    <div className="truncate">
      {formatWei(amount, { toUnit })}
      {alternateUnit && (
        <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
          ({formatWei(amount, { toUnit: alternateUnit })})
        </span>
      )}
    </div>
  );
};
