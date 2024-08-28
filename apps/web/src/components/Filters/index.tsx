import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";

import { Button } from "~/components/Button";
import type { Option } from "../Dropdown";
import { RollupFilter } from "./RollupFilter";

interface FiltersState {
  rollup: Option | null;
}

export const Filters: FC = function () {
  const [formData, setFormData] = useState<FiltersState>({
    rollup: null,
  });
  const router = useRouter();

  const allowToFilter = !!formData.rollup;

  const handleSubmit = () => {
    if (formData.rollup) {
      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          rollup: formData.rollup.value,
        },
      });
    }
  };

  const handleClear = () => {
    router.push({ pathname: router.pathname, query: undefined });
    setFormData({ rollup: null });
  };

  const handleRollupFilterChange = (newRollup: Option) => {
    setFormData((prevState) => ({ ...prevState, rollup: newRollup }));
  };

  return (
    <form
      className="flex flex-col justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-primary-900 sm:flex-row"
      onSubmit={handleSubmit}
    >
      <RollupFilter
        selected={formData.rollup}
        onChange={handleRollupFilterChange}
      />
      <div className="flex flex-row gap-2">
        <Button
          label="Clear"
          variant="outline"
          onClick={handleClear}
          disabled={!allowToFilter}
        />
        <Button
          label="Filter"
          onClick={handleSubmit}
          disabled={!allowToFilter}
        />
      </div>
    </form>
  );
};
