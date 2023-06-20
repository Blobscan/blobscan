import { type FC, type ReactNode } from "react";

import { Header } from "~/components/Header";
import { type CardProps } from "../Cards/Card";
import { ChartCard } from "../Cards/ChartCard";
import { MetricCard, type MetricCardProps } from "../Cards/MetricCard";

export type StatsSectionsProps = {
  header: CardProps["header"];
  charts?: { chart: ReactNode; name: ReactNode }[];
  metrics?: MetricCardProps[];
};

export const StatsLayout: FC<StatsSectionsProps> = function ({
  header,
  charts,
  metrics,
}) {
  return (
    <>
      <Header>{header}</Header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics ? (
          metrics.map((metric, i) => <MetricCard key={i} {...metric} />)
        ) : (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <MetricCard key={i} />
            ))}
          </>
        )}
      </div>
      <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 [&>div]:w-full`}>
        {charts
          ? charts.map(({ chart, name }, i) => (
              <ChartCard key={i} title={name}>
                {chart}
              </ChartCard>
            ))
          : Array.from({ length: 2 }).map((_, i) => <ChartCard key={i} />)}
      </div>
    </>
  );
};
