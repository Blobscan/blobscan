import { useEffect, useMemo } from "react";
import type { FC } from "react";

import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps, Option } from "~/components/Dropdown";
import { useQueryParams } from "~/hooks/useQueryParams";
import { useRollupRegistry } from "~/hooks/useRollupRegistry";
import type { Rollup } from "~/types";
import { capitalize } from "~/utils";
import { RollupBadge } from "../Badges/RollupBadge";

export type RollupOption = Option<Rollup>;

type RollupFilterProps = Pick<
  DropdownProps<Rollup, true, true>,
  "selected" | "disabled" | "onChange"
>;

export const RollupFilter: FC<RollupFilterProps> = function ({
  onChange,
  selected,
  disabled,
}) {
  const rollupRegistry = useRollupRegistry();

  const { params } = useQueryParams();
  const rollupOptions = useMemo<RollupOption[]>(() => {
    if (!rollupRegistry) {
      return [];
    }

    return rollupRegistry.geAll().map(
      ([name]) =>
        ({
          value: name.toLowerCase() as Rollup,
          selectedLabel: (
            <RollupBadge rollup={name.toLowerCase() as Rollup} size="sm" />
          ),
          label: (
            <div className="flex flex-row items-center gap-2">
              <RollupBadge rollup={name.toLowerCase() as Rollup} compact />
              <div>{capitalize(name)}</div>
            </div>
          ),
        } satisfies RollupOption)
    );
  }, [rollupRegistry]);

  useEffect(() => {
    const rollups = params?.rollups;

    if (!rollups) {
      return;
    }

    const selectedRollupOptions = rollupOptions.filter((opt) =>
      rollups.includes(opt.value)
    );

    if (selectedRollupOptions) {
      onChange(selectedRollupOptions);
    }
  }, [rollupOptions, params?.rollups, onChange]);

  return (
    <Dropdown
      selected={selected}
      options={rollupOptions}
      onChange={onChange}
      placeholder="Rollup"
      width="w-[120px] min-[440px]:w-[180px] min-[540px]:w-[260px] min-[580px]:w-[280px] sm:w-[170px] md:w-[110px] lg:w-[180px] xl:w-[200px]"
      disabled={disabled}
      clearable
      multiple
    />
  );
};
