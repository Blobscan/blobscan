import type { FC } from "react";
import { useCallback, useMemo, useRef } from "react";
import { useState } from "react";
import type { Color, EChartOption, ECElementEvent } from "echarts";
import EChartsReact from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import { useTheme } from "next-themes";

import { ROLLUP_REGISTRY } from "@blobscan/rollups";

import type { Rollup } from "~/types";
import {
  createToolBox,
  createTooltip,
  formatMetricValue,
  performCumulativeSum,
} from "./helpers";
import type { MetricInfo } from "./types";

export interface ChartBaseProps {
  metricInfo: {
    xAxis: MetricInfo;
    yAxis: MetricInfo;
  };
  options: EChartOption & {
    tooltipExtraOptions?: {
      displayTotal?: boolean;
    };
  };

  compact?: boolean;
}

function getCategorySeriesStyle(
  seriesName: string,
  themeMode: "dark" | "light"
): { color: Color } | undefined {
  if (seriesName === "other") {
    return { color: "#505050" };
  }

  const rollupSettings = ROLLUP_REGISTRY[seriesName as Rollup];

  if (rollupSettings) {
    return { color: rollupSettings.color[themeMode] as Color };
  }
}

function buildAxisOptions(metricInfo: MetricInfo) {
  const { type } = metricInfo;
  const axisType: EChartOption.BasicComponents.CartesianAxis.Type =
    type === "time" ? "category" : "value";
  const axisLabelFormatter = (value: string | number) =>
    formatMetricValue(value, metricInfo, true);

  return {
    type: axisType,
    axisLabel: {
      formatter: axisLabelFormatter,
    },
  };
}

export const ChartBase: FC<ChartBaseProps> = function ({
  metricInfo,
  options,
  compact = false,
}) {
  const { resolvedTheme } = useTheme();
  const themeMode = resolvedTheme as "light" | "dark";
  const hoveredSeriesRef = useRef<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>(null);
  const [showCumulative, setShowCumulative] = useState(false);
  const { xAxis: xAxisMetricInfo, yAxis: yAxisMetricInfo } = metricInfo;
  const {
    series: seriesOptions,
    grid: gridOptions,
    xAxis: xAxisOptions,
    yAxis: yAxisOptions,
    toolbox: toolboxOptions,
    tooltip: tooltipOptions,
    tooltipExtraOptions,
    ...restOptions
  } = options;
  const tooltip = createTooltip({
    currentSeriesRef: hoveredSeriesRef,
    metricInfo,
    displayTotal: tooltipExtraOptions?.displayTotal,
    themeMode,
    opts: tooltipOptions,
  });
  const toolbox = !compact
    ? createToolBox({
        themeMode,
        opts: toolboxOptions,
        onClickCumulative() {
          setShowCumulative((prevShowCumulative) => !prevShowCumulative);
        },
      })
    : undefined;

  const formattedChartSeries = useMemo(
    () =>
      seriesOptions?.map<EChartOption.Series>((series) => {
        const { data, ...restSeries } = series;

        let newData = data;

        if (showCumulative && data) {
          newData = performCumulativeSum(data);
        }

        return {
          smooth: true,
          data: newData,
          areaStyle: {},
          itemStyle: series.name
            ? getCategorySeriesStyle(series.name, themeMode)
            : undefined,
          emphasis: {
            focus: "series",
          },
          ...restSeries,
        } as EChartOption.Series;
      }),
    [seriesOptions, showCumulative, themeMode]
  );

  const onChartReady = useCallback((chart: EChartsInstance) => {
    chart.on("mouseover", (params: ECElementEvent) => {
      if (params.componentType === "series") {
        hoveredSeriesRef.current = {
          seriesIndex: params.seriesIndex,
          seriesName: params.seriesName,
        };
      }
    });

    chart.on("globalout", () => {
      hoveredSeriesRef.current = null;
    });
  }, []);

  return (
    <EChartsReact
      onChartReady={onChartReady}
      option={
        {
          series: formattedChartSeries,
          grid: {
            top: 27,
            right: 10,
            bottom: 22,
            left: 40,
            ...(gridOptions || {}),
          },
          xAxis: {
            ...buildAxisOptions(xAxisMetricInfo),
            boundaryGap: true,
            axisTick: {
              alignWithLabel: true,
            },
            ...(compact
              ? {
                  axisLine: { show: false },
                }
              : {}),
            ...(xAxisOptions || {}),
          },
          yAxis: {
            ...buildAxisOptions(yAxisMetricInfo),
            splitLine: { show: false },
            axisLine: { show: !compact },
            ...(yAxisOptions || {}),
          },
          toolbox,
          tooltip,
          animationEasing: "linear",
          ...restOptions,
        } satisfies EChartOption
      }
      style={{ height: "100%", width: "100%" }}
    />
  );
};

export type {
  MetricInfo,
  MetricType,
  MetricUnitType,
  TimeSeriesBaseProps,
} from "./helpers";
