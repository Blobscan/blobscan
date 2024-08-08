import { useState } from "react";
import type { FC } from "react";

import { Button } from "~/components/Button";
import type { Rollup } from "~/types";
import type { Option } from "../../Dropdown/Dropdown";
import type { PaginatedTableQueryFilters } from "../PaginatedTable";
import { RollupFilter } from "./RollupFilter";

interface FilterPanelState {
  rollup: Option | null;
}

interface FilterPanelProps {
  onFilter: (queryFilters: PaginatedTableQueryFilters) => void;
}

export const FilterPanel: FC<FilterPanelProps> = function ({ onFilter }) {
  const [formData, setFormData] = useState<FilterPanelState>({
    rollup: null,
  });

  const allowToFilter = !!formData.rollup;

  const handleSubmit = () => {
    !!formData.rollup && onFilter({ rollup: formData.rollup.value as Rollup });
  };

  const handleRollupFilterChange = (newRollup: Option) => {
    setFormData((prevState) => ({ ...prevState, rollup: newRollup }));
  };

  return (
    <form
      className="flex justify-between rounded-lg bg-slate-50 p-2 dark:bg-primary-900"
      onSubmit={handleSubmit}
    >
      <RollupFilter
        selected={formData.rollup}
        onChange={handleRollupFilterChange}
      />
      <Button label="Filter" onClick={handleSubmit} disabled={!allowToFilter} />
    </form>
  );
};
