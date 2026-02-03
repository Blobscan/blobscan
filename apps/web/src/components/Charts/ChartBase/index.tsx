import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import classNames from "classnames";
import type { EChartOption, ECElementEvent } from "echarts";
import type { EChartsInstance } from "echarts-for-react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useTheme } from "next-themes";

import type { TimeFrame } from "@blobscan/api";

import echarts from "~/echarts";
import type { TimeseriesDimension } from "~/types";
import { Legend } from "./Legend";
import type { LegendItemData, LegendProps } from "./Legend";
import {
  createXAxisOptions,
  createBaseToolboxOptions,
  createBaseTooltipOptions,
  createYAxisOptions,
  DEFAULT_SERIES_COLOR,
  createBaseSeriesOptions,
  getDimensionColor,
} from "./helpers";
import { createChartSkeletonOptions } from "./helpers/skeleton";
import type { ChartBaseProps as ChartBaseProps_, MetricInfo } from "./types";

export interface ChartBaseProps extends ChartBaseProps_ {
  dataset?: EChartOption.Dataset | EChartOption.Dataset[];
  series: EChartOption.Series[];
  metricInfo: {
    xAxis: MetricInfo;
    yAxis: MetricInfo;
  };
  isLoading?: boolean;
  options?: {
    loading?: {
      timeFrame?: TimeFrame;
      chartType?: "line" | "bar";
    };
    tooltip?: {
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
  isLoading,
}) {
  const { resolvedTheme } = useTheme();
  const chartInstanceRef = useRef<EChartsInstance | null>(null);
  const hoveredSeriesRef = useRef<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>(null);
  const chartSkeletonOptions = useMemo(
    () =>
      createChartSkeletonOptions({
        ...optionsProp?.loading,
        compact,
      }),
    [optionsProp?.loading, compact]
  );
  const [legendItems, setLegendItems] = useState<LegendItemData[]>([]);
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
  const baseOptions = useMemo(
    () =>
      ({
        animationEasing: "cubicOut",
        animationDuration: 500,
        animationDelayUpdate: (idx: number) => idx * 2,
        animationThreshold: 20_000,
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
          displayTotal: optionsProp?.tooltip?.displayTotal,
          themeMode,
        }),
        toolbox: !compact ? createBaseToolboxOptions({ themeMode }) : undefined,
        dataZoom: !compact
          ? [{ type: "inside" }, { type: "slider", start: 0, end: 100 }]
          : undefined,
      } satisfies EChartOption),
    [compact, metricInfo, optionsProp?.tooltip, themeMode]
  );

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
        ({ name, itemStyle }): LegendItemData => ({
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
      } satisfies LegendItemData);
    }

    setLegendItems(items);
  }, [compact, series]);

  useEffect(() => {
    const chart = chartInstanceRef.current?.getEchartsInstance();

    if (!chart || !series || !dataset) return;

    chart.setOption(
      {
        ...baseOptions,
        series,
        dataset,
      },
      {
        notMerge: true,
      }
    );
  }, [baseOptions, dataset, series]);

  return (
    <div
      className={classNames(
        "relative flex h-full w-full flex-col gap-1 overflow-visible md:flex-row md:gap-2",
        {
          "animate-pulse": isLoading,
        }
      )}
    >
      <ReactEChartsCore
        echarts={echarts}
        ref={chartInstanceRef}
        onChartReady={onChartReady}
        option={isLoading ? chartSkeletonOptions : baseOptions}
        style={{ height: "100%", width: "100%" }}
      />
      {isLoading && !compact ? (
        <div className="absolute bottom-3 left-10 h-9 w-[90%] rounded-md bg-[#e5e7eb52] opacity-10" />
      ) : null}
      {!compact && (
        <div className="h-4 md:h-full">
          <Legend
            items={legendItems}
            selectedItem={selectedLegendItem}
            isLoading={isLoading}
            onItemToggle={handleLegendItemToggle}
            onItemHover={handleLegendItemHover}
          />
        </div>
      )}
    </div>
  );
};

export type { MetricInfo, MetricType, MetricUnitType } from "./types";
