import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { formatBytes } from "~/utils";
import type { TimeSeriesProps } from "../ChartBase/types";

export type DailyBlobsSizeProps = TimeSeriesProps<string>;

const DailyBlobSizeChart: FC<DailyBlobsSizeProps> = React.memo(function ({
  days,
  series,
  ...restProps
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
      {...restProps}
    />
  );
});

DailyBlobSizeChart.displayName = "DailyBlobSizeChart";

export { DailyBlobSizeChart };
