import { useEffect, useMemo } from "react";

import { useQueryParams } from "~/hooks/useQueryParams";
import { useRollupRegistry } from "~/hooks/useRollupRegistry";
import { ROLLUP_STYLES } from "~/rollups";
import type { Rollup } from "~/types";
import { RollupBadge } from "../Badges/RollupBadge";
import type { ComboboxProps, SelectOption } from "../Selects";
import { Combobox } from "../Selects";

export type RollupSelectorOption = SelectOption<Rollup>;

export type RollupSelectorProps = Omit<
  ComboboxProps<Rollup, true, true>,
  "options" | "multiple" | "nullable" | "placeholder"
>;

export function RollupSelector(props: RollupSelectorProps) {
  const onChange = props.onChange;
  const rollupRegistry = useRollupRegistry();

  const { params } = useQueryParams();
  const rollupOptions = useMemo<RollupSelectorOption[]>(() => {
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
        } satisfies RollupSelectorOption)
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
      {...props}
      options={rollupOptions}
      placeholder="Rollup"
      multiple
      nullable
    />
  );
}
