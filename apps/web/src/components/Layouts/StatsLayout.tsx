import { type FC, type ReactNode } from "react";

import { Header } from "~/components/Header";
import { type CardProps } from "../Cards/Card";
import { ChartCard } from "../Cards/ChartCard";
import { MetricCard, type MetricCardProps } from "../Cards/MetricCard";

export type StatsSectionsProps = {
  header: CardProps["header"];
  charts: { chart: ReactNode; name: ReactNode }[];
  metrics: MetricCardProps[];
};

export const StatsLayout: FC<StatsSectionsProps> = function ({
  header,
  charts,
  metrics,
}) {
  return (
    <>
      <Header>{header}</Header>
      <div className="grid gap-4 sm:grid-cols-4">
        {metrics.map((metric, i) => (
          <MetricCard key={i} {...metric} />
        ))}
      </div>
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
    </>
  );
};
