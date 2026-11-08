import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import cn from "classnames";
import type { ECElementEvent, EChartsOption, SeriesOption } from "echarts";
import type { EChartsInstance } from "echarts-for-react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useTheme } from "next-themes";

import { EmptyState } from "~/components/EmptyState";
import { HelpIcon } from "~/components/HelpIcon";
import echarts from "~/echarts";
import type { Size, ThemeMode, TimeseriesDimension } from "~/types";
import { Legend } from "./Legend";
import type { LegendItemData, LegendPosition, LegendProps } from "./Legend";
import {
  addCurrentPeriodColumns,
  createXAxisOptions,
  createBaseToolboxOptions,
  createBaseTooltipOptions,
  createCurrentPeriodSeries,
  createYAxisOptions,
  getBinaryAxisScale,
  getLeftAxisMax,
  DEFAULT_SERIES_COLOR,
  createBaseSeriesOptions,
  getCurrentPeriod,
  getDatasetColumnValue,
  getDimensionColor,
  getMainSeriesIndex,
  getSeriesMetricValue,
  hasCurrentPeriodValue,
  hasValueUnits,
  isCurrentPeriodSeries,
} from "./helpers";
import type { ChartDataset, ChartSeries, TooltipTotalOptions } from "./helpers";
import type { SkeletonChartOptions } from "./helpers/skeleton";
import { createChartSkeletonOptions } from "./helpers/skeleton";
import type { Axes } from "./types";

export interface SkeletonOptions {
  chart?: SkeletonChartOptions;
  legend?: LegendProps["skeletonOpts"];
}

export interface ChartBaseProps {
  title: ReactNode;
  /** A text that tells what the chart shows. An icon after the title shows it. */
  description?: ReactNode;
  headerControls?: ReactNode;
  /**
   * When a dataset includes the current period, which is not complete, the
   * chart draws its point as in progress.
   */
  dataset?: ChartDataset | ChartDataset[];
  series?: SeriesOption[];
  axes: Axes;
  compact?: boolean;
  /** Where the legend goes. The default is "right". */
  legendPosition?: LegendPosition;
  /**
   * The chart sorts the series by name. Set it to false to keep the order of
   * `series`. The legend and the tooltip show the series in reverse order.
   */
  sortSeries?: boolean;
  isLoading?: boolean;
  size?: Size;
  skeletonOpts?: SkeletonOptions;
  tooltipOpts?: TooltipTotalOptions;
}

function ChartHeader({
  title,
  description,
  dataUnit,
  controls,
  isLoading,
}: {
  title: ReactNode;
  description?: ReactNode;
  dataUnit?: string;
  controls?: ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className="flex w-full justify-between p-1">
      {title && (
        <div className="flex-start -mb-2 flex items-center gap-1.5 font-semibold">
          {`${title}${dataUnit ? ` (${dataUnit})` : ""}`}
          {description && <HelpIcon description={description} />}
        </div>
      )}
      {!isLoading && controls}
    </div>
  );
}

function DataZoomSkeleton() {
  return (
    <div className="absolute bottom-3 left-10 h-9 w-[90%] rounded-md bg-[#EADEFD] dark:bg-[#434672]" />
  );
}

export const ChartBase: FC<ChartBaseProps> = function ({
  title,
  description,
  headerControls,
  dataset,
  axes,
  skeletonOpts,
  tooltipOpts,
  series: seriesProp,
  compact,
  legendPosition = "right",
  sortSeries = true,
  isLoading,
  size = "md",
}) {
  const { resolvedTheme } = useTheme();
  const themeMode = resolvedTheme as ThemeMode;
  // echarts-for-react replaces its first instance when the first render ends.
  // The effects and the handlers use the final instance, which onChartReady
  // gives.
  const [chart, setChart] = useState<EChartsInstance | null>(null);
  const hoveredSeriesRef = useRef<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>(null);
  const [isChartInteractive, setIsChartInteractive] = useState(false);
  const [legendItems, setLegendItems] = useState<LegendItemData[]>([]);
  const [selectedLegendItem, setSelectedLegendItem] = useState<
    string | undefined
  >();
  const datasetAvailable = Array.isArray(dataset)
    ? !!dataset.length
    : !!dataset;
  const shouldRenderChart = isLoading === true || datasetAvailable;

  // The chart component unmounts and disposes its instance. Clear the instance
  // during this render, so that no effect uses the disposed instance.
  if (!shouldRenderChart && chart) {
    setChart(null);
  }

  // The title shows the unit only when the values do not show it.
  const yUnit = hasValueUnits(axes.y)
    ? undefined
    : axes.y.displayUnit ?? axes.y.unit;
  const chartSkeletonOptions = useMemo(
    () =>
      createChartSkeletonOptions({
        ...(skeletonOpts?.chart ?? {}),
        compact,
        themeMode,
      }),
    [skeletonOpts?.chart, compact, themeMode]
  );
  const series = useMemo(
    () =>
      seriesProp
        ?.map((series, i) => {
          const { name: seriesNameProp, id, ...restSeries } = series;

          const baseSeriesOptions = createBaseSeriesOptions(i);
          const [type, name] = id ? String(id).split("-") : [];

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
        ?.sort((a, b) =>
          sortSeries ? String(a.name).localeCompare(String(b.name)) : 0
        ),
    [seriesProp, themeMode, sortSeries]
  );
  const currentPeriod = useMemo(
    () =>
      dataset && getCurrentPeriod(Array.isArray(dataset) ? dataset : [dataset]),
    [dataset]
  );
  const currentPeriodTimestamp = currentPeriod?.timestamp;
  const chartDataset = useMemo(() => {
    if (!dataset || !currentPeriodTimestamp) {
      return dataset;
    }

    // Add the current period columns only for the metrics that the series
    // draw. The datasets can have many more metric columns.
    const metricColumns = [
      ...new Set(
        (series as ChartSeries[] | undefined)?.flatMap((s) =>
          s.encode?.y ? [s.encode.y] : []
        )
      ),
    ];

    return Array.isArray(dataset)
      ? dataset.map((d) =>
          addCurrentPeriodColumns(d, currentPeriodTimestamp, metricColumns)
        )
      : addCurrentPeriodColumns(dataset, currentPeriodTimestamp, metricColumns);
  }, [dataset, currentPeriodTimestamp, series]);
  // The current period series go after all the other series, so the series
  // indexes that the tooltip uses do not change.
  const chartSeries = useMemo(() => {
    if (!series || !dataset || !currentPeriodTimestamp) {
      return series;
    }

    const datasets = Array.isArray(dataset) ? dataset : [dataset];
    // A series with no value for the current period (for example, a rollup
    // with no blobs) needs no current period series. It keeps its column.
    const seriesGroups = series.map((s, seriesIdx) =>
      hasCurrentPeriodValue(s as ChartSeries, datasets, currentPeriodTimestamp)
        ? createCurrentPeriodSeries(s as ChartSeries, { seriesIdx })
        : [s]
    );

    return [
      ...seriesGroups.map(([s]) => s),
      ...seriesGroups.flatMap(
        ([, ...currentPeriodSeries]) => currentPeriodSeries
      ),
    ];
  }, [series, dataset, currentPeriodTimestamp]);
  const chartSeriesRef = useRef(chartSeries);
  const chartDatasetRef = useRef(chartDataset);

  chartSeriesRef.current = chartSeries;
  chartDatasetRef.current = chartDataset;

  const getSeriesValue = useCallback(
    (seriesIndex: number, dataIndex: number) =>
      currentPeriodTimestamp
        ? getSeriesMetricValue(
            chartSeriesRef.current?.[seriesIndex] as ChartSeries | undefined,
            chartDatasetRef.current,
            dataIndex
          )
        : undefined,
    [currentPeriodTimestamp]
  );
  const getSeriesYAxisIndex = useCallback(
    (seriesIndex: number) =>
      (chartSeriesRef.current?.[seriesIndex] as ChartSeries | undefined)
        ?.yAxisIndex ?? 0,
    []
  );
  const getSeriesStack = useCallback(
    (seriesIndex: number) =>
      (chartSeriesRef.current?.[seriesIndex] as ChartSeries | undefined)?.stack,
    []
  );
  const getDatasetValue = useCallback(
    (column: string, dataIndex: number) =>
      getDatasetColumnValue(chartDatasetRef.current, column, dataIndex),
    []
  );
  // When each byte value shows its own unit, the ticks are powers of 2, for
  // example 256 KiB, 512 KiB and 768 KiB.
  const yScale = useMemo(
    () =>
      hasValueUnits(axes.y) && seriesProp && dataset
        ? getBinaryAxisScale(
            getLeftAxisMax(seriesProp as ChartSeries[], dataset)
          )
        : undefined,
    [axes.y, seriesProp, dataset]
  );
  const baseOptions = useMemo(
    () =>
      ({
        animationEasing: "cubicOut",
        animationDuration: 300,
        animationDelayUpdate: (idx: number) => idx * 2,
        animationThreshold: 20_000,
        animation: true,
        legend: {
          show: false,
        },
        grid: {
          // The top label of the right y-axis must be below the toolbox.
          top: axes.y2 ? 44 : 27,
          // The right y-axis needs space for its labels.
          right: axes.y2 ? 40 : 10,
          bottom: compact ? 22 : 82,
          left: 40,
        },
        xAxis: createXAxisOptions(axes.x, compact),
        yAxis: axes.y2
          ? [
              createYAxisOptions(axes.y, compact, yScale),
              createYAxisOptions(axes.y2, compact, { position: "right" }),
            ]
          : createYAxisOptions(axes.y, compact, yScale),
        tooltip: createBaseTooltipOptions({
          currentSeriesRef: hoveredSeriesRef,
          axes,
          ...tooltipOpts,
          themeMode,
          currentPeriod,
          getSeriesValue,
          getSeriesYAxisIndex,
          getSeriesStack,
          getDatasetValue,
        }),
        toolbox: !compact ? createBaseToolboxOptions({ themeMode }) : undefined,
        dataZoom: !compact
          ? [{ type: "inside" }, { type: "slider", start: 0, end: 100 }]
          : undefined,
      } satisfies EChartsOption),
    [
      compact,
      axes,
      yScale,
      tooltipOpts,
      themeMode,
      currentPeriod,
      getSeriesValue,
      getSeriesYAxisIndex,
      getSeriesStack,
      getDatasetValue,
    ]
  );

  const idleTimerRef = useRef<number | null>(null);

  const setUpChartFinishedEventHandler = useCallback(
    (chart: EChartsInstance) => {
      const onFinished = () => {
        if (idleTimerRef.current !== null) {
          window.clearTimeout(idleTimerRef.current);
        }

        idleTimerRef.current = window.setTimeout(() => {
          setIsChartInteractive(true);
          idleTimerRef.current = null;
        }, 100);
      };

      chart.on("finished", onFinished);

      return () => {
        chart.off("finished", onFinished);

        if (idleTimerRef.current !== null) {
          window.clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
      };
    },
    []
  );

  useEffect(() => {
    if (!chart) return;

    setIsChartInteractive(false);
    chart.dispatchAction({ type: "hideTip" });

    const cleanup = setUpChartFinishedEventHandler(chart);

    return cleanup;
  }, [chart, dataset, series, isLoading, setUpChartFinishedEventHandler]);

  useEffect(() => {
    if (!chart) return;

    chart.dispatchAction({ type: "hideTip" });
    chart.setOption({ tooltip: { show: !isLoading } }, { notMerge: false });
  }, [chart, dataset, series, isLoading]);

  useEffect(() => {
    if (!chart) return;

    const hasCurrentPeriodSeries = () =>
      !!(chartSeriesRef.current as ChartSeries[] | undefined)?.some((s) =>
        isCurrentPeriodSeries(s.id)
      );

    const onMouseover = ({
      componentType,
      seriesName,
      seriesIndex,
    }: ECElementEvent) => {
      if (componentType !== "series") return;
      setSelectedLegendItem(seriesName);
      hoveredSeriesRef.current = {
        seriesIndex: getMainSeriesIndex(
          (chartSeriesRef.current as ChartSeries[] | undefined) ?? [],
          seriesIndex
        ),
        seriesName,
      };

      // A series and its current period series are separate ECharts series,
      // and a hover highlights only the series under the mouse. Highlight all
      // the series with the name, as a hover on the legend does.
      if (hasCurrentPeriodSeries()) {
        chart.dispatchAction({ type: "highlight", seriesName });
      }
    };

    const onMouseout = ({ componentType, seriesName }: ECElementEvent) => {
      if (componentType !== "series" || !hasCurrentPeriodSeries()) return;

      chart.dispatchAction({ type: "downplay", seriesName });
    };

    const onGlobalout = () => {
      chart.dispatchAction({ type: "downplay" });
      chart.dispatchAction({ type: "hideTip" });
      hoveredSeriesRef.current = null;
      setSelectedLegendItem(undefined);
    };

    chart.on("mouseover", onMouseover);
    chart.on("mouseout", onMouseout);
    chart.on("globalout", onGlobalout);

    return () => {
      chart.off("mouseover", onMouseover);
      chart.off("mouseout", onMouseout);
      chart.off("globalout", onGlobalout);
    };
  }, [chart]);

  const handleLegendItemHover = useCallback<
    NonNullable<LegendProps["onItemHover"]>
  >(
    (itemName, direction) => {
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
    [chart]
  );

  const handleLegendItemToggle = useCallback<
    NonNullable<LegendProps["onItemToggle"]>
  >(
    (itemName, disabled) => {
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
    [chart, legendItems]
  );

  useEffect(() => {
    if (compact || !series?.length) {
      return;
    }

    const items = series
      .map(
        ({ name, itemStyle }): LegendItemData => ({
          name: name?.toString() ?? "",
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
    if (!chart || !chartSeries || !chartDataset) return;

    chart.setOption(
      {
        ...baseOptions,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        series: chartSeries,
        dataset: chartDataset,
      },
      {
        notMerge: true,
      }
    );
  }, [chart, baseOptions, chartDataset, chartSeries]);

  useEffect(() => {
    if (!chart || !isLoading) return;

    chart.setOption(chartSkeletonOptions, {
      notMerge: true,
    });
  }, [chart, chartSkeletonOptions, isLoading]);

  return (
    <div className="h-full">
      <ChartHeader
        title={title}
        description={description}
        dataUnit={yUnit}
        controls={shouldRenderChart ? headerControls : undefined}
        isLoading={isLoading}
      />
      <div
        className={cn(
          "relative flex w-full flex-col gap-1 overflow-visible",
          { "md:flex-row md:gap-2": legendPosition === "right" },
          {
            "h-48 md:h-56 lg:h-56": size === "xs",
            "h-[180px] sm:h-56": size === "sm",
            "h-[220px] sm:h-[354px]": size === "md",
            "h-[260px] sm:h-96": size === "lg",
            "h-[300px] sm:h-[26rem]": size === "xl",
            "h-[22rem] sm:h-[22rem] md:h-[28rem] lg:h-[30rem] xl:h-[36rem]":
              size === "2xl",
          },
          {
            "animate-pulse": isLoading,
            "pointer-events-none": !isChartInteractive,
          }
        )}
      >
        {shouldRenderChart ? (
          <ReactEChartsCore
            echarts={echarts}
            // The final instance gets this option before onChartReady. During
            // a load, give the skeleton, so that the empty axes do not show.
            option={isLoading ? chartSkeletonOptions : baseOptions}
            onChartReady={setChart}
            // In a flex row, the chart must shrink below the canvas width.
            // Then its container gets smaller and the chart resizes.
            className="min-w-0"
            style={{ height: "100%", width: "100%" }}
          />
        ) : (
          <EmptyState size={"md"} description="No Chart Data" />
        )}
        {isLoading && !compact ? <DataZoomSkeleton /> : null}
        {!compact && shouldRenderChart && (
          <div
            className={cn("h-4", { "md:h-full": legendPosition === "right" })}
          >
            <Legend
              items={legendItems}
              position={legendPosition}
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
