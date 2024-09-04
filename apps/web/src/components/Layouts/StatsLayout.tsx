import { Fragment } from "react";
import type { FC, ReactNode } from "react";

import { Header } from "~/components/Header";
import type { CardProps } from "../Cards/Card";
import { MetricCard } from "../Cards/MetricCard";
import type { MetricCardProps } from "../Cards/MetricCard";

export type StatsSectionsProps = {
  header: CardProps["header"];
  charts: ReactNode[];
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
      <div className={`grid grid-cols-1 gap-4 lg:grid-cols-2 [&>div]:w-full`}>
        {charts.map((chart, i) => (
          <Fragment key={i}>{chart}</Fragment>
        ))}
      </div>
    </>
  );
};
