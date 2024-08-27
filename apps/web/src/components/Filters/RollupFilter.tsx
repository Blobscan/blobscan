import type { FC } from "react";

import { Rollup } from "@blobscan/api/enums";

import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps } from "~/components/Dropdown";
import { RollupIcon } from "~/components/RollupIcon";
import type { Rollup as RollupType } from "~/types";
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
        options={Object.values(Rollup).map((rollup) => ({
          value: rollup,
          label: capitalize(rollup),
          prefix: <RollupIcon rollup={rollup.toLowerCase() as RollupType} />,
        }))}
        onChange={onChange}
        placeholder="Rollup"
        width="w-40"
      />
    </>
  );
};
