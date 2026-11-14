import { useMemo } from "react";

import { ROLLUP_DEFINITIONS } from "~/defintions/rollups";
import { useRollupRegistry } from "~/hooks/useRollupRegistry";
import type { Rollup } from "~/types";
import { RollupBadge } from "../Badges/RollupBadge";
import type { ComboboxProps, SelectOption } from "../Selects";
import { Combobox } from "../Selects";

export type RollupSelectorOption = SelectOption<Rollup>;

export type RollupSelectorProps = Omit<
  ComboboxProps<Rollup, true, true>,
  "options" | "multiple" | "nullable" | "placeholder"
>;

export const ROLLUP_OPTIONS: RollupSelectorOption[] = Object.entries(
  ROLLUP_DEFINITIONS
).map(([id, definition]) => ({
  value: id as Rollup,
  label: <RollupBadge rollup={id as Rollup} size="sm" />,
  searchText: definition.name,
}));

export function RollupSelector(props: RollupSelectorProps) {
  const rollupRegistry = useRollupRegistry();
  const rollupOptions = useMemo(() => {
    if (!rollupRegistry) {
      return [];
    }

    return ROLLUP_OPTIONS.filter((opt) =>
      rollupRegistry.hasRollup(
        opt.value.toUpperCase() as Parameters<
          typeof rollupRegistry.hasRollup
        >[0]
      )
    );
  }, [rollupRegistry]);

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
