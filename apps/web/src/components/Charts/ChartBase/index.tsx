import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import type { EChartOption, ECElementEvent } from "echarts";
import type { EChartsInstance } from "echarts-for-react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useTheme } from "next-themes";

import echarts from "~/echarts";
import { Legend } from "./Legend";
import type { LegendItem } from "./Legend";
import {
  createToolBox,
  createTooltip,
  formatMetricValue,
  getDataPointsSize,
} from "./helpers";
import {
  DEFAULT_COLOR,
  getSeriesColor,
  inferSeriesName,
} from "./helpers/colors";
import type { ChartBaseProps as ChartBaseProps_, MetricInfo } from "./types";

export interface ChartBaseProps extends ChartBaseProps_ {
  metricInfo: {
    xAxis: MetricInfo;
    yAxis: MetricInfo;
  };
  options: EChartOption & {
    tooltipExtraOptions?: {
      displayTotal?: boolean;
    };
  };
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
  showLegend = false,
}) {
  const { resolvedTheme } = useTheme();
  const chartInstanceRef = useRef<EChartsInstance | null>(null);
  const hoveredSeriesRef = useRef<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>(null);
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
  const dataPointsSize = useMemo(
    () => (options.dataset ? getDataPointsSize(options.dataset) : 0),
    [options.dataset]
  );
  const animationEnabled = dataPointsSize < 20_000;
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
        themeMode,
        opts: toolboxOptions,
      })
    : undefined;
  const formattedSeries = useMemo(() => {
    return seriesOptions

      ?.map((series, i) => {
        const { name, id, ...restSeries } = series;

        const seriesLabel = name?.length ? name : id ? inferSeriesName(id) : "";
        const color = getSeriesColor({
          seriesName: seriesLabel.toLowerCase(),
          seriesIndex: i,
          themeMode,
        });

        return {
          name: seriesLabel,
          smooth: true,
          areaStyle: {},
          itemStyle: {
            color,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          id,
          ...restSeries,
        };
      })
      ?.sort((a, b) =>
        (a.name?.toLowerCase() ?? "").localeCompare(b.name?.toLowerCase() ?? "")
      );
  }, [seriesOptions, themeMode]);

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
    if (!showLegend || !formattedSeries?.length) {
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
  }, [showLegend, formattedSeries]);

  return (
    <div className="flex h-full w-full flex-col gap-1 overflow-visible md:flex-row md:gap-2">
      <ReactEChartsCore
        echarts={echarts}
        ref={chartInstanceRef}
        onChartReady={onChartReady}
        option={
          {
            animation: animationEnabled,
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
            series: formattedSeries,
            ...restOptions,
          } satisfies EChartOption
        }
        style={{ height: "100%", width: "100%" }}
      />
      {showLegend && (
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
      )}
    </div>
  );
};

export type { MetricInfo, MetricType, MetricUnitType } from "./helpers";
