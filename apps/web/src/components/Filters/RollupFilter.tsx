import type { FC } from "react";

import { Rollup as Rollups } from "@blobscan/api/enums";

import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps } from "~/components/Dropdown";
import { RollupIcon } from "~/components/RollupIcon";
import type { Rollup } from "~/types";
import { capitalize } from "~/utils";

type RollupFilterProps = Pick<DropdownProps, "onChange" | "selected">;

export const RollupFilter: FC<RollupFilterProps> = function ({
  onChange,
  selected,
}) {
  return (
    <>
      <Dropdown
        selected={selected}
        options={Object.values(Rollups).map((rollup) => ({
          value: rollup.toLowerCase(),
          label: capitalize(rollup),
          prefix: <RollupIcon rollup={rollup.toLowerCase() as Rollup} />,
        }))}
        onChange={onChange}
        placeholder="Rollup"
        width="w-40"
      />
    </>
  );
};
