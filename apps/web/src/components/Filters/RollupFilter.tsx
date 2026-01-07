import { useEffect, useMemo } from "react";
import type { FC } from "react";

import { useQueryParams } from "~/hooks/useQueryParams";
import { useRollupRegistry } from "~/hooks/useRollupRegistry";
import { ROLLUP_STYLES } from "~/rollups";
import type { Rollup } from "~/types";
import { RollupBadge } from "../Badges/RollupBadge";
import type { ComboboxProps, Option } from "../Dropdowns";
import { Combobox } from "../Dropdowns";

export type RollupOption = Option<Rollup>;

type RollupFilterProps = Pick<
  ComboboxProps<Rollup, true, true>,
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
          label: (
            <RollupBadge rollup={name.toLowerCase() as Rollup} size="sm" />
          ),
          searchText: ROLLUP_STYLES[name.toLowerCase() as Rollup].label,
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
    <Combobox
      selected={selected}
      options={rollupOptions}
      onChange={onChange}
      placeholder="Rollup"
      disabled={disabled}
      nullable
      multiple
    />
  );
};
