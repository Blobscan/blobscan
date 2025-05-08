import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import type { EChartOption, ECElementEvent } from "echarts";
import EChartsReact from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import { useTheme } from "next-themes";

import { Legend } from "./Legend";
import type { LegendItem } from "./Legend";
import {
  createToolBox,
  createTooltip,
  formatMetricValue,
  performCumulativeSum,
} from "./helpers";
import { DEFAULT_COLOR, getSeriesColor } from "./helpers/colors";
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
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);
  const [selectedLegendItem, setSelectedLegendItem] = useState<
    string | undefined
  >();
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
    chart.on(
      "mouseover",
      ({ componentType, seriesName, seriesIndex }: ECElementEvent) => {
        if (componentType === "series") {
          setSelectedLegendItem(seriesName);
          hoveredSeriesRef.current = {
            seriesIndex,
            seriesName,
          };
        }
      }
    );

    chart.on("mouseout", () => {
      setSelectedLegendItem(undefined);
    });

    chart.on("globalout", () => {
      hoveredSeriesRef.current = null;
      setSelectedLegendItem(undefined);
    });
  }, []);

  const handleLegendToggle = useCallback(
    (itemName: string | "all", direction: "in" | "out") => {
      const chart = chartInstanceRef.current?.getEchartsInstance();

      if (!chart) {
        return;
      }

      if (direction === "in") {
        chart.dispatchAction({
          type: "highlight",
          seriesName: itemName,
        });

        setSelectedLegendItem(itemName);

        return;
      }

      if (direction === "out") {
        chart.dispatchAction({
          type: "downplay",
          seriesName: itemName,
        });

        setSelectedLegendItem(undefined);

        return;
      }
    },
    []
  );

  useEffect(() => {
    if (!formattedSeries?.length) {
      return;
    }

    const items = [
      ...formattedSeries.map(
        ({ name, itemStyle }): LegendItem => ({
          name: name ?? "",
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          color: itemStyle?.color ?? DEFAULT_COLOR,
          disabled: false,
        })
      ),
    ].reverse();

    if (items.length > 1) {
      items.unshift({
        name: "All",
        color: undefined,
        disabled: false,
      } satisfies LegendItem);
    }

    setLegendItems(items);
  }, [formattedSeries]);

  useEffect(() => {
    const chartInstance = chartInstanceRef.current?.getEchartsInstance();

    if (!chartInstance) {
      return;
    }

    chartInstance.setOption(
      {
        series: formattedSeries,
      },
      { replaceMerge: ["series"] }
    );
  }, [formattedSeries]);

  return (
    <div className="flex h-full w-full flex-col gap-1 md:flex-row md:gap-1">
      <EChartsReact
        ref={chartInstanceRef}
        onChartReady={onChartReady}
        option={
          {
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
      <div className="h-4 md:h-full">
        <Legend
          items={legendItems}
          selectedItem={selectedLegendItem}
          onItemToggle={(itemName, disabled) => {
            const chart = chartInstanceRef.current?.getEchartsInstance();

            if (!chart) {
              return;
            }

            if (itemName === "all") {
              chart.dispatchAction({
                type: disabled ? "legendUnSelect" : "legendToggleSelect",
                batch: legendItems.map(({ name }) => ({ name })),
              });

              setLegendItems((prev) =>
                prev.map((item) => ({ ...item, disabled }))
              );

              return;
            }

            chart.dispatchAction({
              type: "legendToggleSelect",
              name: itemName,
            });

            setLegendItems((prev) =>
              prev.map((item) =>
                item.name === itemName ? { ...item, disabled } : item
              )
            );
          }}
          onItemHover={handleLegendToggle}
        />
      </div>
    </div>
  );
};

export type {
  MetricInfo,
  MetricType,
  MetricUnitType,
  TimeSeriesBaseProps,
} from "./helpers";
