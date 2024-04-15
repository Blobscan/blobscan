import type { FC } from "react";

import { formatWei } from "~/utils";
import type { EtherUnit } from "~/utils";

type EtherUnitDisplayProps = {
  amount: bigint | number;
  toUnit?: EtherUnit;
};

export const EtherUnitDisplay: FC<EtherUnitDisplayProps> = function ({
  amount,
  toUnit = "ether",
}) {
  return (
    <div className="truncate">
      {formatWei(amount, { toUnit })}
      {toUnit !== "Gwei" && (
        <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
          ({formatWei(amount)})
        </span>
      )}
    </div>
  );
};
