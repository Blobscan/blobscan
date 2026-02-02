import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import type { EChartOption, ECElementEvent } from "echarts";
import type { EChartsInstance } from "echarts-for-react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useTheme } from "next-themes";

import echarts from "~/echarts";
import type { TimeseriesDimension } from "~/types";
import { Legend } from "./Legend";
import type { LegendItem, LegendProps } from "./Legend";
import {
  createXAxisOptions,
  createBaseToolboxOptions,
  createBaseTooltipOptions,
  createYAxisOptions,
  DEFAULT_SERIES_COLOR,
  createBaseSeriesOptions,
  getDimensionColor,
} from "./helpers";
import type { ChartBaseProps as ChartBaseProps_, MetricInfo } from "./types";

export interface ChartBaseProps extends ChartBaseProps_ {
  dataset?: EChartOption.Dataset | EChartOption.Dataset[];
  series: EChartOption.Series[];
  metricInfo: {
    xAxis: MetricInfo;
    yAxis: MetricInfo;
  };
  options?: Omit<EChartOption, "dataset" | "series" | "legend"> & {
    tooltipExtraOptions?: {
      displayTotal?: boolean;
    };
  };
}

export const ChartBase: FC<ChartBaseProps> = function ({
  dataset,
  metricInfo,
  options: optionsProp,
  series: seriesProp,
  compact,
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
  const themeMode = resolvedTheme as "light" | "dark";
  const series = useMemo(
    () =>
      seriesProp
        ?.map((series, i) => {
          const { name: seriesNameProp, id, ...restSeries } = series;

          const baseSeriesOptions = createBaseSeriesOptions(i);
          const [type, name] = id ? id.split("-") : [];

          const seriesLabel = seriesNameProp ?? name ?? "Unknown";

          const color = getDimensionColor(
            { type, name } as TimeseriesDimension,
            themeMode
          );

          return {
            ...baseSeriesOptions,
            name: seriesLabel,
            itemStyle: {
              ...baseSeriesOptions.itemStyle,
              color,
            },
            ...restSeries,
          };
        })
        ?.sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [seriesProp, themeMode]
  );

  const baseOptions = useMemo(() => {
    const {
      grid: gridOptions,
      xAxis: xAxisOptions,
      yAxis: yAxisOptions,
      toolbox: toolboxOptions,
      tooltip: tooltipOptions,
      tooltipExtraOptions,
      ...restOptions
    } = optionsProp ?? {};

    const defaults = {
      animationEasing: "linear",
      animationDurationUpdate: 100,
      animationDuration: 100,
      animationEasingUpdate: "linear",
      animation: true,
      legend: {
        show: false,
      },
      grid: {
        top: 27,
        right: 10,
        bottom: compact ? 22 : 82,
        left: 40,
      },
      xAxis: createXAxisOptions(metricInfo.xAxis, compact),
      yAxis: createYAxisOptions(metricInfo.yAxis, compact),
      tooltip: createBaseTooltipOptions({
        currentSeriesRef: hoveredSeriesRef,
        metricInfo,
        displayTotal: tooltipExtraOptions?.displayTotal,
        themeMode,
      }),
      toolbox: !compact ? createBaseToolboxOptions({ themeMode }) : undefined,
      dataZoom: !compact
        ? [{ type: "inside" }, { type: "slider", start: 0, end: 100 }]
        : undefined,
    } satisfies EChartOption;

    return {
      ...defaults,
      ...restOptions,
      grid: {
        ...defaults.grid,
        ...gridOptions,
      },
      xAxis: {
        ...defaults.xAxis,
        ...xAxisOptions,
      },
      yAxis: {
        ...defaults.yAxis,
        ...yAxisOptions,
      },
      toolbox: {
        ...defaults.toolbox,
        ...toolboxOptions,
      },
      tooltip: {
        ...defaults.tooltip,
        ...tooltipOptions,
      },
    } satisfies EChartOption;
  }, [compact, metricInfo, optionsProp, themeMode]);

  const onChartReady = useCallback((chart: EChartsInstance) => {
    chart.on(
      "mouseover",
      ({ componentType, seriesName, seriesIndex }: ECElementEvent) => {
        if (componentType !== "series") return;

        setSelectedLegendItem(seriesName);
        hoveredSeriesRef.current = {
          seriesIndex,
          seriesName,
        };
      }
    );

    chart.on("globalout", () => {
      chart.dispatchAction({ type: "downplay" });
      hoveredSeriesRef.current = null;
      setSelectedLegendItem(undefined);
    });
  }, []);

  const handleLegendItemHover = useCallback<
    NonNullable<LegendProps["onItemHover"]>
  >((itemName, direction) => {
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
  }, []);

  const handleLegendItemToggle = useCallback<
    NonNullable<LegendProps["onItemToggle"]>
  >(
    (itemName, disabled) => {
      const chart = chartInstanceRef.current?.getEchartsInstance();

      if (!chart) {
        return;
      }

      if (itemName === "all") {
        chart.dispatchAction({
          type: disabled ? "legendUnSelect" : "legendToggleSelect",
          batch: legendItems.map(({ name }) => ({ name })),
        });

        setLegendItems((prev) => prev.map((item) => ({ ...item, disabled })));

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
    },
    [legendItems]
  );

  useEffect(() => {
    if (compact || !series?.length) {
      return;
    }

    const items = series
      .map(
        ({ name, itemStyle }): LegendItem => ({
          name: name ?? "",
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          color: itemStyle?.color ?? DEFAULT_SERIES_COLOR,
          disabled: false,
        })
      )
      .reverse();

    if (items.length > 1) {
      items.unshift({
        name: "All",
        color: undefined,
        disabled: false,
      } satisfies LegendItem);
    }

    setLegendItems(items);
  }, [compact, series]);

  useEffect(() => {
    const chart = chartInstanceRef.current?.getEchartsInstance();

    if (!chart || !series) return;

    chart.setOption(
      {
        series,
        dataset,
      },
      {
        replaceMerge: ["series", "dataset"],
      }
    );
  }, [baseOptions, dataset, series]);

  return (
    <div className="flex h-full w-full flex-col gap-1 overflow-visible md:flex-row md:gap-2">
      <ReactEChartsCore
        echarts={echarts}
        ref={chartInstanceRef}
        onChartReady={onChartReady}
        option={baseOptions}
        lazyUpdate
        style={{ height: "100%", width: "100%" }}
      />
      {!compact && (
        <div className="h-4 md:h-full">
          <Legend
            items={legendItems}
            selectedItem={selectedLegendItem}
            onItemToggle={handleLegendItemToggle}
            onItemHover={handleLegendItemHover}
          />
        </div>
      )}
    </div>
  );
};

export type { MetricInfo, MetricType, MetricUnitType } from "./helpers";
