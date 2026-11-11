import type { FC } from "react";
import { useMemo } from "react";
import { useTheme } from "next-themes";

import { ChartBase } from "~/components/Charts/ChartBase";
import type { ThemeMode } from "~/types";
import type { ChartSpec } from "./helpers/charts";
import { buildDataset } from "./helpers/charts";
import type { AddressRole, AddressTimeseries } from "./types";

const ROLE_TITLE_LABELS: Record<AddressRole, string> = {
  sent: "As Sender",
  received: "As Receiver",
};

export type SectionChartsProps = {
  charts: ChartSpec[];
  data?: AddressTimeseries;
  roles: AddressRole[];
  /** The role with more transactions. Some charts show only this role. */
  mainRole?: AddressRole;
  isLoading?: boolean;
};

/** Shows the charts of a section, one chart on each line. */
export const SectionCharts: FC<SectionChartsProps> = function ({
  charts,
  data,
  roles,
  mainRole = "sent",
  isLoading,
}) {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "light") as ThemeMode;
  const dataset = useMemo(
    () => (data ? buildDataset(data) : undefined),
    [data]
  );
  return (
    <div className="flex flex-col gap-14">
      {charts.map(
        ({
          title,
          description,
          yAxis,
          y2Axis,
          series,
          tooltipOpts,
          sortSeries,
          mainRoleOnly,
        }) => {
          const chartSeries = series(
            mainRoleOnly ? [mainRole] : roles,
            theme,
            data?.granularity ?? "day"
          );

          return (
            <ChartBase
              key={title}
              title={
                mainRoleOnly
                  ? `${title} (${ROLE_TITLE_LABELS[mainRole]})`
                  : title
              }
              description={description}
              isLoading={isLoading}
              dataset={dataset}
              series={chartSeries}
              axes={{
                x: { type: "time", granularity: data?.granularity },
                y: yAxis,
                y2: y2Axis,
              }}
              tooltipOpts={tooltipOpts}
              sortSeries={sortSeries}
              legendPosition="bottom"
              size="xl"
              skeletonOpts={{
                chart: { variant: "bar", itemCount: 90 },
                legend: {
                  itemCount:
                    Math.max(chartSeries.length, 1) +
                    (chartSeries.length > 1 ? 1 : 0),
                },
              }}
            />
          );
        }
      )}
    </div>
  );
};
