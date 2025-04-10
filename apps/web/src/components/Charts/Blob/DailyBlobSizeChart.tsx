import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { formatBytes } from "~/utils";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyBlobsSizeProps = TimeSeriesBaseProps<
  {
    name?: string;
    values: string[];
  }[]
>;

export const DailyBlobSizeChart: FC<DailyBlobsSizeProps> = function ({
  days,
  series,
}) {
  const scaledSeries = series?.map(({ name, values }) => ({
    name,
    values: values.map((v) =>
      formatBytes(v, { unit: "GiB", hideUnit: true, displayAllDecimals: true })
    ),
  }));

  return (
    <ChartCard
      title="Daily Blob Size"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: {
          type: "count",
          unitType: "byte",
          unit: "GiB",
        },
      }}
      options={{
        xAxis: {
          data: days,
        },
        series: scaledSeries?.map(({ name, values }) => ({
          name,
          data: values,
          type: "bar",
          stack: "total",
        })),
        tooltipExtraOptions: {
          displayTotal: true,
        },
      }}
    />
  );
};
