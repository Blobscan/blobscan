import type { FC } from "react";

import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps } from "~/components/Dropdown";
import { RollupIcon } from "~/components/RollupIcon";
import { api } from "~/api-client";
import { capitalize } from "~/utils";

type RollupFilterProps = Pick<DropdownProps, "onChange" | "selected">;

export const RollupFilter: FC<RollupFilterProps> = function ({
  onChange,
  selected,
}) {
  const { data: rollups } = api.getRollups.useQuery();

  if (!rollups) {
    return null;
  }

  return (
    <Dropdown
      selected={selected}
      options={rollups.map((rollup) => ({
        value: rollup,
        label: capitalize(rollup),
        prefix: <RollupIcon rollup={rollup} />,
      }))}
      onChange={onChange}
      placeholder="Rollup"
      width="w-40"
    />
  );
};
