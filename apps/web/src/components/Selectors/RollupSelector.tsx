import { useMemo } from "react";

import { RollupRegistry } from "@blobscan/rollups";

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

export const ROLLUP_OPTIONS: RollupSelectorOption[] = RollupRegistry.create(1)
  .geAll()
  .map(
    ([name]) =>
      ({
        value: name.toLowerCase() as Rollup,
        label: <RollupBadge rollup={name.toLowerCase() as Rollup} size="sm" />,
        searchText: ROLLUP_STYLES[name.toLowerCase() as Rollup].label,
      } satisfies RollupSelectorOption)
  );

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
