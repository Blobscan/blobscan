import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { UrlObject } from "url";

import { Button } from "~/components/Button";
import type { Option } from "../Dropdown";
import { RollupFilter } from "./RollupFilter";

export const Filters: FC = function () {
  const router = useRouter();
  const [selectedRollup, setSelectedRollup] = useState<Option | null>(null);
  const disableFilter = !selectedRollup;

  const handleFilter = () => {
    const query: UrlObject["query"] = {};

    if (selectedRollup) {
      query.rollup = selectedRollup.value;
    }

    router.push({
      pathname: router.pathname,
      query,
    });
  };

  const handleClear = () => {
    router.push({ pathname: router.pathname, query: undefined });
    setSelectedRollup(null);
  };

  return (
    <div className="flex flex-col justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-primary-900 sm:flex-row">
      <RollupFilter
        selected={selectedRollup}
        onChange={(newRollup) => {
          setSelectedRollup(newRollup);
        }}
      />
      <div className="flex flex-row gap-2">
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={disableFilter}
        >
          Clear
        </Button>
        <Button onClick={handleFilter} disabled={disableFilter}>
          Filter
        </Button>
      </div>
    </div>
  );
};
