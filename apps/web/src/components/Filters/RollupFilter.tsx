import type { FC } from "react";

import { getChainRollups } from "@blobscan/rollups";

import { Dropdown } from "~/components/Dropdown";
import type { Option } from "~/components/Dropdown";
import { RollupIcon } from "~/components/RollupIcon";
import { env } from "~/env.mjs";
import type { Rollup } from "~/types";
import { capitalize, getChainIdByName } from "~/utils";
import { RollupBadge } from "../Badges/RollupBadge";

type RollupFilterProps = {
  onChange(newRollup: Option[]): void;
  selected: Option[] | null;
};

const chainId = getChainIdByName(env.NEXT_PUBLIC_NETWORK_NAME);
const rollups = chainId ? getChainRollups(chainId) : [];

export const ROLLUP_OPTIONS: Option[] = [
  {
    value: "null",
    label: "None",
  },
  ...rollups.map(([rollupAddress, rollupName]) => {
    return {
      value: rollupAddress,
      inputDisplay: (
        <RollupBadge rollup={rollupName.toLowerCase() as Rollup} size="sm" />
      ),
      prefix: <RollupIcon rollup={rollupName.toLowerCase() as Rollup} />,
      label: capitalize(rollupName),
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
      multiple={true}
      placeholder="Rollup"
      width="sm:w-[130px] w-full xl:w-[240px] md:max-lg:w-full"
      clearable
    />
  );
};
