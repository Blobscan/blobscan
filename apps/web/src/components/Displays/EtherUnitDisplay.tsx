import type { FC } from "react";

import { formatWei } from "~/utils";

type EtherUnitDisplayProps = {
  amount: bigint | number;
};

export const EtherUnitDisplay: FC<EtherUnitDisplayProps> = function ({
  amount,
}) {
  return (
    <div>
      {formatWei(amount, { toUnit: "ether" })}
      <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
        ({formatWei(amount)})
      </span>
    </div>
  );
};
