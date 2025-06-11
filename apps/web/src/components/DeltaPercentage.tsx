import cn from "classnames";

import { calculatePercentage } from "~/utils";

type DeltaPercentageChangeProps<T extends number | bigint> = {
  initialValue: T;
  finalValue: T;
};

export const DeltaPercentageChange = function <T extends number | bigint>({
  initialValue,
  finalValue,
}: DeltaPercentageChangeProps<T>) {
  console.log("Rendering");

  const sign =
    finalValue < initialValue ? "-" : finalValue > initialValue ? "+" : "";
  const delta = finalValue - initialValue;

  const deltaPercentage = calculatePercentage(
    delta < 0 ? -delta : delta,
    initialValue
  );

  return (
    <span
      className={cn({
        "text-red-600 dark:text-red-400": sign === "-",
        "text-green-600 dark:text-green-400": sign === "+",
        "text-contentTertiary-light dark:text-contentTertiary-dark":
          sign === "",
      })}
    >
      ({sign}
      {deltaPercentage}%)
    </span>
  );
};
