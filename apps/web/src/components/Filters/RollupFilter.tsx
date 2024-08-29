import type { FC } from "react";

import { Rollup as Rollups } from "@blobscan/api/enums";

import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps, Option } from "~/components/Dropdown";
import { RollupIcon } from "~/components/RollupIcon";
import type { Rollup } from "~/types";
import { capitalize } from "~/utils";

type RollupFilterProps = Pick<DropdownProps, "selected"> & {
  onChange(newRollup: Option | null): void;
};

const ROLLUP_OPTIONS: Option[] = [
  {
    value: "null",
    label: "None",
  },
  ...Object.values(Rollups).map((rollup) => {
    const rollup_ = rollup.toLowerCase() as Rollup;

    return {
      value: rollup_,
      label: (
        <div className="flex items-center gap-2">
          <RollupIcon rollup={rollup_} />
          {capitalize(rollup)}
        </div>
      ),
    };
  }),
];

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
