import { useRef } from "react";
import type { FC } from "react";

import { getChainRollups } from "@blobscan/rollups";

import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps, Option } from "~/components/Dropdown";
import { RollupIcon } from "~/components/RollupIcon";
import { env } from "~/env.mjs";
import type { Rollup } from "~/types";
import { capitalize, getChainIdByName } from "~/utils";
import { RollupBadge } from "../Badges/RollupBadge";

type RollupFilterProps = Pick<DropdownProps, "selected" | "disabled"> & {
  onChange(newRollups: Option[]): void;
  selected: Option[] | null;
};

const chainId = getChainIdByName(env.NEXT_PUBLIC_NETWORK_NAME);
const rollups = chainId ? getChainRollups(chainId) : [];

export const ROLLUP_OPTIONS = rollups.map(
  ([name, addresses]) =>
    ({
      value: addresses,
      selectedLabel: (
        <RollupBadge rollup={name.toLowerCase() as Rollup} size="sm" />
      ),
      label: (
        <div className="flex flex-row items-center gap-2">
          <RollupIcon rollup={name.toLowerCase() as Rollup} />
          <div>{capitalize(name)}</div>
        </div>
      ),
    } satisfies Option)
) satisfies Option[];

export const RollupFilter: FC<RollupFilterProps> = function ({
  onChange,
  selected,
  disabled,
}) {
  const noneIsSelected = useRef<boolean>(false);

  const handleOnChange = (newRollups_: Option[]) => {
    let newRollups = newRollups_;
    const noneOptionIndex = newRollups.findIndex((r) => r.value === "null");

    if (noneIsSelected.current && newRollups.length > 1) {
      noneIsSelected.current = false;
      newRollups = newRollups.filter((_, index) => index !== noneOptionIndex);
    }

    if (
      !noneIsSelected.current &&
      noneOptionIndex !== -1 &&
      newRollups.length > 1
    ) {
      noneIsSelected.current = true;
      newRollups = newRollups.filter((_, index) => index === noneOptionIndex);
    }

    onChange(newRollups);
  };

  return (
    <Dropdown
      selected={selected}
      options={ROLLUP_OPTIONS}
      onChange={handleOnChange}
      placeholder="Rollup"
      width="sm:w-full w-full xl:w-[200px] md:max-lg:w-full"
      disabled={disabled}
      clearable
      multiple
    />
  );
};
