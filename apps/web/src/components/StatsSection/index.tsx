import { type FC, type ReactNode } from "react";

import { ChartCard } from "../Cards/ChartCard";
import { MetricCard, type MetricCardProps } from "../Cards/MetricCard";
import { SectionCard, type SectionCardProps } from "../Cards/SectionCard";

export type StatsSectionsProps = {
  header: SectionCardProps["header"];
  charts: { chart: ReactNode; name: ReactNode }[];
  metrics: MetricCardProps[];
};

export const StatsSection: FC<StatsSectionsProps> = function ({
  charts,
  metrics,
}) {
  return (
    <>
      <SectionCard header="Metrics">
        <div className="grid grid-cols-4 gap-4">
          {metrics.map((metric, i) => (
            <MetricCard key={i} {...metric} />
          ))}
        </div>
      </SectionCard>
      <SectionCard header="Charts">
        <div
          className={`grid grid-cols-1 gap-6 ${
            charts.length === 1 ? "sm:grid-cols-1" : "sm:grid-cols-2"
          } [&>div]:w-full`}
        >
          {charts.map(({ chart, name }, i) => (
            <ChartCard key={i} title={name}>
              {chart}
            </ChartCard>
          ))}
        </div>
      </SectionCard>
    </>
  );
};
