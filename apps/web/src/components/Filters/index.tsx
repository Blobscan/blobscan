import { useEffect, useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { UrlObject } from "url";

import { Button } from "~/components/Button";
import { useQueryParams } from "~/hooks/useQueryParams";
import type { Option } from "../Dropdown";
import { ROLLUP_OPTIONS, RollupFilter } from "./RollupFilter";

export const Filters: FC = function () {
  const router = useRouter();
  const queryParams = useQueryParams();
  const [selectedRollup, setSelectedRollup] = useState<Option | null>(null);
  const disableClear = !selectedRollup;

  const handleFilter = () => {
    const query: UrlObject["query"] = {};

    if (selectedRollup) {
      if (selectedRollup.value === "null") {
        query.rollup = selectedRollup.value;
      } else {
        query.from = selectedRollup.value;
      }
    }

    router.push({
      pathname: router.pathname,
      query,
    });
  };

  const handleClear = () => {
    setSelectedRollup(null);
  };

  useEffect(() => {
    if (queryParams.rollup) {
      const rollupOption = ROLLUP_OPTIONS.find(
        (opt) => opt.value === queryParams.rollup
      );

      if (rollupOption) {
        setSelectedRollup(rollupOption);
      }
    }
  }, [queryParams]);

  return (
    <div className="flex flex-col justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-primary-900 sm:flex-row">
      <RollupFilter
        selected={selectedRollup}
        onChange={(newRollup) => {
          setSelectedRollup(newRollup);
        }}
      />
      <div className="flex flex-row gap-2">
        <Button variant="outline" onClick={handleClear} disabled={disableClear}>
          Clear
        </Button>
        <Button onClick={handleFilter}>Filter</Button>
      </div>
    </div>
  );
};
