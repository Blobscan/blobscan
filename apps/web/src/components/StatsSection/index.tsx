import { type FC, type ReactNode } from "react";

import { ChartCard } from "../Cards/ChartCard";
import { SectionCard, type SectionCardProps } from "../Cards/SectionCard";

type StatElement = {
  element: ReactNode;
  title: ReactNode;
};

export type StatsSectionsProps = {
  header: SectionCardProps["header"];
  charts: StatElement[];
  metrics?: StatElement[];
};

export const StatsSection: FC<StatsSectionsProps> = function ({
  header,
  charts,
  metrics = [],
}) {
  return (
    <>
      <SectionCard header={header}>
        {metrics.map(({ element }, i) => (
          <div key={i}>{element}</div>
        ))}
      </SectionCard>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>div]:w-full">
        {charts.map(({ element, title }, i) => (
          <ChartCard key={i} title={title}>
            {element}
          </ChartCard>
        ))}
      </div>
    </>
  );
};
