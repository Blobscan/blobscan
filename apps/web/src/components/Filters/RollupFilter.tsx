import type { FC } from "react";

import { getChainRollups } from "@blobscan/rollups";

import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps, Option } from "~/components/Dropdown";
import { RollupIcon } from "~/components/RollupIcon";
import { env } from "~/env.mjs";
import type { Rollup } from "~/types";
import { capitalize, getChainIdByName } from "~/utils";

type RollupFilterProps = Pick<DropdownProps, "selected"> & {
  onChange(newRollup: Option | null): void;
};

const chainId = getChainIdByName(env.NEXT_PUBLIC_NETWORK_NAME);
const rollups = chainId ? getChainRollups(chainId) : [];

export const ROLLUP_OPTIONS: Option[] = [
  {
    value: "null",
    label: "None",
  },
  ...rollups.map(([rollupAddress, rollupName]) => ({
    value: rollupAddress,
    label: (
      <div className="flex items-center gap-2">
        <RollupIcon rollup={rollupName.toLowerCase() as Rollup} />
        {capitalize(rollupName)}
      </div>
    ),
  })),
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
      width="sm:w-[130px] w-full md:max-lg:w-full"
      clearable
    />
  );
};
