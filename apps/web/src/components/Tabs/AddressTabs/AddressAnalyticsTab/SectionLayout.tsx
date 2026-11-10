import type { FC, ReactNode } from "react";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { SectionCharts } from "./SectionCharts";
import type { ChartSpec } from "./helpers/charts";
import type { AnalyticsSectionProps } from "./types";

export type SectionLayoutProps = Pick<
  AnalyticsSectionProps,
  "timeseries" | "isTimeseriesLoading" | "roles" | "mainRole"
> & {
  cards: MetricCardProps[];
  charts: ChartSpec[];
  /** The controls of the charts, for example the time frame. */
  controls: ReactNode;
};

/**
 * The layout of a section of the Analytics tab: the metric cards, then one
 * card with the controls and the charts.
 */
export const SectionLayout: FC<SectionLayoutProps> = function ({
  cards,
  charts,
  controls,
  timeseries,
  isTimeseriesLoading,
  roles,
  mainRole,
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {cards.map((card) => (
          <MetricCard key={card.name} {...card} />
        ))}
      </div>
      <Card>
        {/* The Card gap is too small between the controls and the charts. */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-wrap items-center gap-4">{controls}</div>
          <SectionCharts
            charts={charts}
            data={timeseries}
            roles={roles}
            mainRole={mainRole}
            isLoading={isTimeseriesLoading}
          />
        </div>
      </Card>
    </div>
  );
};
