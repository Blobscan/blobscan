import type { FC } from "react";
import { useCallback, useMemo, useRef } from "react";
import { useState } from "react";
import type { EChartOption, ECElementEvent } from "echarts";
import EChartsReact from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import { useTheme } from "next-themes";

import { Legend } from "./Legend";
import {
  createToolBox,
  createTooltip,
  formatMetricValue,
  performCumulativeSum,
} from "./helpers";
import { getSeriesColor } from "./helpers/colors";
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
  const cachedCumulativeSumsRef = useRef<string[][] | null>(null);
  const chartInstanceRef = useRef<EChartsInstance | null>(null);
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
  const themeMode = resolvedTheme as "light" | "dark";

  const tooltip = createTooltip({
    currentSeriesRef: hoveredSeriesRef,
    metricInfo,
    displayTotal: tooltipExtraOptions?.displayTotal,
    themeMode,
    opts: tooltipOptions,
  });
  const toolbox = !compact
    ? createToolBox({
        extraFeatures: {
          cumulativeSum:
            yAxisMetricInfo.type === "count"
              ? {
                  onClick() {
                    setShowCumulative(
                      (prevShowCumulative) => !prevShowCumulative
                    );
                  },
                }
              : undefined,
        },
        themeMode,
        opts: toolboxOptions,
      })
    : undefined;

  const formattedSeries = useMemo(() => {
    return seriesOptions
      ?.sort((a, b) =>
        (a.name?.toLowerCase() ?? "").localeCompare(b.name?.toLowerCase() ?? "")
      )
      ?.map((series, i) => {
        const { data, name, ...restSeries } = series;

        let newData = data;

        if (showCumulative && data) {
          if (!cachedCumulativeSumsRef.current) {
            cachedCumulativeSumsRef.current = [];
          }

          let cumulativeSums = cachedCumulativeSumsRef.current[i];

          if (!cumulativeSums) {
            cumulativeSums = performCumulativeSum(data);
            cachedCumulativeSumsRef.current[i] = cumulativeSums;
          }

          newData = cumulativeSums;
        }

        const color = getSeriesColor({
          seriesName: name,
          seriesIndex: i,
          themeMode,
        });

        return {
          name,
          smooth: true,
          data: newData,
          areaStyle: {},
          itemStyle: {
            color,
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          ...restSeries,
        };
      });
  }, [seriesOptions, showCumulative, themeMode]);

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
    <div className="flex h-full w-full flex-col gap-1 md:flex-row md:gap-1">
      <EChartsReact
        ref={chartInstanceRef}
        onChartReady={onChartReady}
        option={
          {
            series: formattedSeries as EChartOption.Series[],
            legend: {
              show: false,
            },
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
        style={{ height: "100%", width: "95%" }}
      />
      <Legend echartRef={chartInstanceRef} />
    </div>
  );
};

export type {
  MetricInfo,
  MetricType,
  MetricUnitType,
  TimeSeriesBaseProps,
} from "./helpers";
