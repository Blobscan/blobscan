import type { FC } from "react";
import { Radio, RadioGroup } from "@headlessui/react";
import classNames from "classnames";

export const FEE_UNITS = ["eth", "usd"] as const;

export type FeeUnit = (typeof FEE_UNITS)[number];

const FEE_UNIT_LABELS: Record<FeeUnit, string> = {
  eth: "ETH",
  usd: "USD",
};

type FeeUnitToggleProps = {
  unit: FeeUnit;
  onChange: (unit: FeeUnit) => void;
};

export const FeeUnitToggle: FC<FeeUnitToggleProps> = ({ unit, onChange }) => {
  return (
    <RadioGroup
      value={unit}
      onChange={onChange}
      aria-label="Fee unit"
      className="flex h-8 w-fit cursor-pointer flex-row items-center rounded-md bg-controlBackground-light text-sm shadow-md dark:bg-controlBackground-dark"
    >
      {FEE_UNITS.map((u, i) => (
        <Radio
          key={u}
          value={u}
          className={classNames(
            "flex h-full items-center justify-center px-3 font-medium transition-colors",
            {
              "border-r border-white/5": i < FEE_UNITS.length - 1,
              "rounded-s-md": i === 0,
              "rounded-e-md": i === FEE_UNITS.length - 1,
              "text-icon-light hover:text-iconHighlight-light dark:text-icon-dark dark:hover:text-iconHighlight-dark":
                unit !== u,
              "bg-primary-300/40 dark:bg-primary-600/30": unit === u,
            }
          )}
        >
          {FEE_UNIT_LABELS[u]}
        </Radio>
      ))}
    </RadioGroup>
  );
};
