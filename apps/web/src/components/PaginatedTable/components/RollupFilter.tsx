import type { FC } from "react";

import { Dropdown } from "~/components/Dropdown/Dropdown";
import type { DropdownProps } from "~/components/Dropdown/Dropdown";
import { RollupIcon } from "~/components/RollupIcon";
import type { Rollup } from "~/types";

const rollups: Rollup[] = [
  "base",
  "mode",
  "scroll",
  "arbitrum",
  "blast",
  "boba",
  "camp",
  "kroma",
  "linea",
  "metal",
  "optimism",
  "optopia",
  "paradex",
  "pgn",
  "starknet",
  "taiko",
  "zksync",
  "zora",
];

const ROLLUP_OPTIONS: DropdownProps["options"] = rollups.map((rollup) => {
  const icon = <RollupIcon rollup={rollup} />;
  return {
    value: rollup,
    label: rollup.charAt(0).toUpperCase() + rollup.slice(1),
    prefix: icon === null ? <div className="h-4 w-4"></div> : icon,
  };
});

type RollupFilterProps = Pick<DropdownProps, "onChange" | "selected">;

export const RollupFilter: FC<RollupFilterProps> = function ({
  onChange,
  selected,
}) {
  return (
    <Dropdown
      selected={selected}
      options={ROLLUP_OPTIONS}
      onChange={onChange}
      placeholder="Rollup"
      width="w-40"
    />
  );
};
