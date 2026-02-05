import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import classNames from "classnames";
import type { EChartOption, ECElementEvent } from "echarts";
import type { EChartsInstance } from "echarts-for-react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useTheme } from "next-themes";

import echarts from "~/echarts";
import type { Size, TimeseriesDimension } from "~/types";
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
import type { SkeletonChartOptions } from "./helpers/skeleton";
import { createChartSkeletonOptions } from "./helpers/skeleton";
import type { Axes } from "./types";

export interface SkeletonOptions {
  chart?: SkeletonChartOptions;
  legend?: LegendProps["skeletonOpts"];
}

export interface ChartBaseProps {
  title: ReactNode;
  headerControls?: ReactNode;
  dataset?: EChartOption.Dataset | EChartOption.Dataset[];
  series?: EChartOption.Series[];
  axes: Axes;
  compact?: boolean;
  isLoading?: boolean;
  size?: Size;
  skeletonOpts?: SkeletonOptions;
  tooltipOpts?: {
    displayTotal?: boolean;
  };
}

const SIZES: Record<Size, string> = {
  xs: "h-48 md:h-56 lg:h-56",
  sm: "h-48 md:h-56 lg:h-56",
  md: "h-60 md:h-72 lg:h-72",
  lg: "h-72 md:h-80 lg:h-[22rem]",
  xl: "h-84 md:h-96 lg:h-[26rem]",
  "2xl": "h-96 md:h-[28rem] lg:h-[30rem]",
};

export const ChartBase: FC<ChartBaseProps> = function ({
  title,
  headerControls,
  dataset,
  axes,
  skeletonOpts,
  tooltipOpts,
  series: seriesProp,
  compact,
  isLoading,
  size = "md",
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
        ...(skeletonOpts?.chart ?? {}),
        compact,
      }),
    [skeletonOpts?.chart, compact]
  );
  const [legendItems, setLegendItems] = useState<LegendItemData[]>([]);
  const [selectedLegendItem, setSelectedLegendItem] = useState<
    string | undefined
  >();
  const themeMode = resolvedTheme as "light" | "dark";
  const datasetExists = Array.isArray(dataset) ? !!dataset.length : !!dataset;
  const yUnit = axes.y.displayUnit ?? axes.y.unit;
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
              color: color ?? baseSeriesOptions.itemStyle.color,
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
        xAxis: createXAxisOptions(axes.x, compact),
        yAxis: createYAxisOptions(axes.y, compact),
        tooltip: createBaseTooltipOptions({
          currentSeriesRef: hoveredSeriesRef,
          axes,
          displayTotal: tooltipOpts?.displayTotal,
          themeMode,
        }),
        toolbox: !compact ? createBaseToolboxOptions({ themeMode }) : undefined,
        dataZoom: !compact
          ? [{ type: "inside" }, { type: "slider", start: 0, end: 100 }]
          : undefined,
      } satisfies EChartOption),
    [compact, axes, tooltipOpts, themeMode]
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

    console.log(series);

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
    <div>
      <div className="flex w-full justify-between p-1">
        {title && (
          <div className="flex-start -mb-2 flex font-semibold">
            {`${title}${yUnit ? ` (${yUnit})` : ""}`}
          </div>
        )}
        {!isLoading && headerControls}
      </div>
      <div
        className={classNames(
          "relative flex h-full w-full flex-col gap-1 overflow-visible md:flex-row md:gap-2",
          SIZES[size],
          {
            "animate-pulse": isLoading,
          }
        )}
      >
        {isLoading || datasetExists ? (
          <ReactEChartsCore
            echarts={echarts}
            ref={chartInstanceRef}
            onChartReady={onChartReady}
            option={isLoading ? chartSkeletonOptions : baseOptions}
            style={{ height: "100%", width: "100%" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-md text-contentSecondary-light dark:text-contentSecondary-dark">
              No Data Available
            </span>
          </div>
        )}
        {isLoading && !compact ? (
          <div className="absolute bottom-3 left-10 h-9 w-[90%] rounded-md bg-[#434672]" />
        ) : null}
        {!compact && (
          <div className="h-4 md:h-full">
            <Legend
              items={legendItems}
              selectedItem={selectedLegendItem}
              isLoading={isLoading}
              skeletonOpts={skeletonOpts?.legend}
              onItemToggle={handleLegendItemToggle}
              onItemHover={handleLegendItemHover}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export type { Axis, AxisType, AxisUnitType } from "./types";
