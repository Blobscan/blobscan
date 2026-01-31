import type { FC, ReactNode } from "react";

import { FiltersBar } from "../FiltersBar";
import { Header } from "../Header";

export type StatPageLayoutProps = {
  chart: ReactNode;
  title: ReactNode;
  description: ReactNode;
  enableFilters?: boolean;
};

export const StatPageLayout: FC<StatPageLayoutProps> = ({
  chart,
  title,
  description,
  enableFilters,
}) => {
  return (
    <div className="flex flex-col gap-8">
      <Header>{title}</Header>
      {enableFilters && <FiltersBar hideRangeFilter hideSortFilter />}
      <div>{description}</div>
      {chart}
    </div>
  );
};
