import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { formatBytes } from "~/utils";
import type { TimeSeriesProps } from "../ChartBase/types";

export type DailyBlobsSizeProps = TimeSeriesProps<string>;

export const DailyBlobSizeChart: FC<DailyBlobsSizeProps> = function ({
  days,
  series,
}) {
  const scaledSeries = series?.map(({ name, values }) => ({
    name,
    values: values.map((v) =>
      Number(
        formatBytes(v, {
          unit: "GiB",
          hideUnit: true,
          displayAllDecimals: true,
        })
      )
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
