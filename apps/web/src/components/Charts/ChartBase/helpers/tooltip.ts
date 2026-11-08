import type { MutableRefObject } from "react";
import type {
  DefaultLabelFormatterCallbackParams,
  TooltipComponentOption,
} from "echarts";

import dayjs from "@blobscan/dayjs";

import { calculatePercentage, getNeighbouringElements } from "~/utils";
import type { Numerish } from "~/utils";
import { aggregateValues } from "../../../TimeseriesCharts/helpers";
import type { Axes, Axis, StandardEncoding } from "../types";
import { isCurrentPeriodSeries } from "./current-period";
import type { CurrentPeriod } from "./current-period";
import { formatAxisValue, formatSeriesName } from "./formatters";

export function isStandardEncoding(value: unknown): value is StandardEncoding {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const v = value as Record<string, unknown>;

  return (
    Array.isArray(v.x) &&
    v.x.every((n) => typeof n === "number") &&
    Array.isArray(v.y) &&
    v.y.every((n) => typeof n === "number")
  );
}

export type SeriesValueGetter = (
  seriesIndex: number,
  dataIndex: number
) => unknown;

/** Returns the index of the y-axis of a series. 1 is the right y-axis. */
export type SeriesYAxisIndexGetter = (seriesIndex: number) => number;

/** Returns the stack of a series, or undefined when it is not stacked. */
export type SeriesStackGetter = (seriesIndex: number) => string | undefined;

/** Returns the value of a dataset column at a data index. */
export type DatasetValueGetter = (column: string, dataIndex: number) => unknown;

export type TooltipTotalOptions = {
  /** Shows the total of the series at the bottom of the tooltip. */
  displayTotal?: boolean;
  /**
   * Adds only the series of this stack into the total. Without it, the
   * total adds all the series of the left y-axis.
   */
  totalStack?: string;
  /**
   * Reads the total from this dataset column, in place of the sum of the
   * series. Use it when the series have values in common, for example a
   * self-send that is in the sent and in the received series.
   */
  totalColumn?: string;
  /** The name of the total. The default is "Total". */
  totalLabel?: string;
};

function toNumerish(value: unknown): Numerish | undefined {
  return typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "bigint"
    ? value
    : undefined;
}

function getValue(
  param: DefaultLabelFormatterCallbackParams,
  getSeriesValue?: SeriesValueGetter
): Numerish | undefined {
  const encode = param.encode;

  if (
    getSeriesValue &&
    param.seriesIndex !== undefined &&
    param.dataIndex !== undefined
  ) {
    const value = getSeriesValue(param.seriesIndex, param.dataIndex);

    if (value !== undefined) {
      return toNumerish(value);
    }
  }

  if (isStandardEncoding(encode)) {
    const dataIndex = encode.y[0];

    if (dataIndex !== undefined && param.data != null) {
      return toNumerish((param.data as unknown as Array<unknown>)[dataIndex]);
    }
  }

  if (Array.isArray(param.value)) {
    return toNumerish(param.value[1]);
  }

  return toNumerish(param.value);
}

function buildSeriesHTMLElement({
  name,
  value,
  axis,
  marker,
  markerColor,
  total,
  isSelected,
  themeMode,
}: {
  name: string;
  value?: Numerish;
  axis: Axis;
  marker?: string;
  markerColor?: string;
  total?: Numerish;
  isSelected?: boolean;
  themeMode?: "light" | "dark";
}) {
  const isDarkMode = themeMode === "dark";
  const percentage =
    value && total ? calculatePercentage(value, total).toFixed(2) : undefined;
  1;
  const formattedValue = value ? formatAxisValue(value, axis) : undefined;
  const markerElement =
    marker ?? markerColor
      ? `<div style="width: 10px; height: 10px; background-color:${markerColor}; border-radius: 50%;"></div>`
      : "";

  return `
    <div style="display: flex; justify-content: space-between; gap: 20px; width: 100%; padding: 0 4px; ${
      isSelected
        ? "background-color: rgba(163, 163, 163, 0.1); border-radius: 4px;"
        : ""
    }">
      <div style="color: ${
        isDarkMode ? "#FFFFFF" : "#171717"
      }; display: flex; align-items: center; gap: 4px;">
        ${markerElement}
        <div>${name}</div>
      </div>
      <div style="color: ${isDarkMode ? "#A3A3A3" : "#404040"};">
        ${formattedValue ?? "-"}
        ${
          percentage
            ? `<span style="opacity: 0.4; font-size: 0.70rem;">(${percentage}%)</span>`
            : ""
        }
      </div>
    </div>`;
}

function isCurrentPeriod(
  param: DefaultLabelFormatterCallbackParams | undefined,
  currentPeriodTimestamp?: Date
) {
  if (!param || !currentPeriodTimestamp) {
    return false;
  }

  // An axis tooltip gives the x value in axisValue. An item tooltip gives it in
  // name.
  const { axisValue, name } = param as { axisValue?: unknown; name?: string };
  const xValue = axisValue ?? (name || undefined);

  return (
    xValue !== undefined &&
    new Date(xValue as number | string).getTime() ===
      currentPeriodTimestamp.getTime()
  );
}

// The tooltip HTML is not React, so the pulse animation has its own keyframes.
// The pulse moves only when the user does not stop animations.
const LIVE_PULSE_STYLE = `<style>
  @keyframes live-pulse {
    75%, 100% { transform: scale(2); opacity: 0; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .live-pulse { animation: live-pulse 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
  }
</style>`;

// A red pulse and "Live" next to the date of the current period. The values of
// the current period are not complete, and the backend updates them during the
// period.
function buildLiveIndicatorHTMLElement(themeMode: "light" | "dark") {
  const color = themeMode === "dark" ? "#F87171" : "#DC2626";

  return `${LIVE_PULSE_STYLE}
  <span style="display: inline-flex; align-items: center; gap: 6px; color: ${color}; font-size: 0.70rem; font-weight: 500;">
    <span style="position: relative; display: inline-flex; width: 8px; height: 8px;">
      <span class="live-pulse" style="position: absolute; display: inline-flex; width: 100%; height: 100%; border-radius: 9999px; opacity: 0.75; background-color: ${color};"></span>
      <span style="position: relative; display: inline-flex; width: 8px; height: 8px; border-radius: 9999px; background-color: ${color};"></span>
    </span>
    Live
  </span>`;
}

function createTooltipFormater({
  currentSeriesRef,
  axes,
  themeMode,
  displayTotal,
  totalStack,
  totalColumn,
  totalLabel = "Total",
  currentPeriod,
  getSeriesValue,
  getSeriesYAxisIndex,
  getSeriesStack,
  getDatasetValue,
}: TooltipTotalOptions & {
  currentSeriesRef: MutableRefObject<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>;
  axes: Axes;
  themeMode: "light" | "dark";
  currentPeriod?: CurrentPeriod;
  getSeriesValue?: SeriesValueGetter;
  getSeriesYAxisIndex?: SeriesYAxisIndexGetter;
  getSeriesStack?: SeriesStackGetter;
  getDatasetValue?: DatasetValueGetter;
}) {
  // A series on the right y-axis uses the format of that axis.
  const isOnSecondYAxis = (seriesIndex?: number) =>
    !!axes.y2 &&
    seriesIndex !== undefined &&
    getSeriesYAxisIndex?.(seriesIndex) === 1;
  const getSeriesAxis = (seriesIndex?: number) =>
    isOnSecondYAxis(seriesIndex) && axes.y2 ? axes.y2 : axes.y;
  // The values of the right y-axis have a different scale, so the total
  // does not include them.
  const isInTotal = (seriesIndex?: number) =>
    !isOnSecondYAxis(seriesIndex) &&
    (totalStack === undefined ||
      (seriesIndex !== undefined &&
        getSeriesStack?.(seriesIndex) === totalStack));

  return (
    allParamOrParams:
      | DefaultLabelFormatterCallbackParams
      | DefaultLabelFormatterCallbackParams[]
  ) => {
    const seriesIndex = currentSeriesRef.current?.seriesIndex;
    // Remove the current period series. They show the same values as the
    // series that they belong to.
    const paramOrParams = Array.isArray(allParamOrParams)
      ? allParamOrParams.filter(
          (p) => !isCurrentPeriodSeries((p as { seriesId?: string }).seriesId)
        )
      : allParamOrParams;

    let dateHTMLElement: string | undefined;
    const seriesHTMLElements: string[] = [];
    const totalSeriesHTMLElements: string[] = [];

    if (Array.isArray(paramOrParams)) {
      if (!paramOrParams.length) {
        return "Loading…";
      }

      const dataIndex = paramOrParams[0]?.dataIndex;
      const columnTotal =
        displayTotal && totalColumn && dataIndex !== undefined
          ? toNumerish(getDatasetValue?.(totalColumn, dataIndex))
          : undefined;
      const dailyTotal = !displayTotal
        ? undefined
        : columnTotal !== undefined
        ? columnTotal
        : aggregateValues(
            paramOrParams
              .filter((p) => isInTotal(p.seriesIndex))
              .map((p) => getValue(p, getSeriesValue)),
            axes.y.type
          );

      const rollupSeries = paramOrParams.filter((d) =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (d.seriesId as string).includes("rollup")
      );
      const totalItems = 15;
      const filteredParams =
        seriesIndex != null
          ? getNeighbouringElements(paramOrParams, seriesIndex, totalItems)
          : paramOrParams.slice(-10); // fallback if no hovered series

      const { name, value } = paramOrParams[0] || {};
      const date = name?.length
        ? name
        : Array.isArray(value)
        ? value[0]
        : value;
      dateHTMLElement =
        date &&
        (typeof date === "string" ||
          typeof date === "number" ||
          date instanceof Date)
          ? formatAxisValue(date, axes.x)
          : "-";

      filteredParams.map((p) => {
        const { seriesName, value, color } = p;
        const currentSeriesName = seriesName?.toLowerCase();

        if (!currentSeriesName || value === undefined) {
          return "";
        }

        const isSelected =
          currentSeriesRef.current?.seriesName?.toLowerCase() ===
          currentSeriesName;

        const formattedName = formatSeriesName(seriesName);

        seriesHTMLElements.push(
          buildSeriesHTMLElement({
            name: formattedName,
            value: getValue(p, getSeriesValue),
            total: isInTotal(p.seriesIndex) ? dailyTotal : undefined,
            axis: getSeriesAxis(p.seriesIndex),
            markerColor: typeof color === "string" ? color : undefined,
            themeMode,
            isSelected,
          })
        );
      });

      if (displayTotal) {
        if (rollupSeries.length) {
          const rollupTotal = aggregateValues(
            rollupSeries.map((p) => getValue(p, getSeriesValue)),
            axes.y.type
          );

          totalSeriesHTMLElements.push(
            buildSeriesHTMLElement({
              name: "Rollup",
              value: rollupTotal,
              axis: axes.y,
              total: dailyTotal,
              themeMode,
            })
          );
        }

        totalSeriesHTMLElements.push(
          buildSeriesHTMLElement({
            name: totalLabel,
            value: dailyTotal,
            axis: axes.y,
            themeMode,
          })
        );
      }
    } else {
      const { name, seriesName, value, color, seriesIndex } = paramOrParams;

      const formattedName = formatSeriesName(seriesName);

      seriesHTMLElements.push(
        buildSeriesHTMLElement({
          name: formattedName,
          value: (value as number | string) ?? 0,
          axis: getSeriesAxis(seriesIndex),
          markerColor: typeof color === "string" ? color : undefined,
          isSelected: true,
          themeMode,
        })
      );

      dateHTMLElement = name ? formatAxisValue(name, axes.x).toString() : "-";
    }

    const isCurrentPeriodHovered = isCurrentPeriod(
      Array.isArray(paramOrParams) ? paramOrParams[0] : paramOrParams,
      currentPeriod?.timestamp
    );
    // Get the relative time on each hover, so it does not stay at the time of
    // the render.
    const currentPeriodLabel =
      isCurrentPeriodHovered && currentPeriod?.updatedAt
        ? `Updated ${dayjs(currentPeriod.updatedAt).fromNow()}`
        : undefined;

    const dateHeaderHTMLElement = `<div style="color: ${
      themeMode === "dark" ? "#FFFFFF" : "#171717"
    }; font-weight: bold;">
            ${dateHTMLElement}
            </div>`;

    return `
          <div style="display: flex; flex-direction: column; gap: 2px;">
            ${
              isCurrentPeriodHovered
                ? `<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              ${dateHeaderHTMLElement}
              ${buildLiveIndicatorHTMLElement(themeMode)}
            </div>`
                : dateHeaderHTMLElement
            }
            ${
              currentPeriodLabel
                ? `<div style="color: ${
                    themeMode === "dark" ? "#A3A3A3" : "#525252"
                  }; font-size: 0.70rem;">${currentPeriodLabel}</div>`
                : ""
            }
            <div style="display: flex; flex-direction: column; gap: 2px; width: 100%;">
              ${seriesHTMLElements.reverse().join("\n")}
            </div>
            ${
              totalSeriesHTMLElements.length
                ? `
                <hr style="border-color: ${
                  themeMode === "dark" ? "#3A3369" : "#D4D4D4"
                }; margin: 4px 0;"/>
                <div style="font-weight: bold;">
                  ${totalSeriesHTMLElements.join("\n")}
                </div>
              `
                : ""
            }
          </div>
        `;
  };
}

export function createBaseTooltipOptions({
  currentSeriesRef,
  displayTotal,
  totalStack,
  totalColumn,
  totalLabel,
  axes,
  themeMode,
  currentPeriod,
  getSeriesValue,
  getSeriesYAxisIndex,
  getSeriesStack,
  getDatasetValue,
}: TooltipTotalOptions & {
  currentSeriesRef: MutableRefObject<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>;
  axes: Axes;
  themeMode: "light" | "dark";
  currentPeriod?: CurrentPeriod;
  /**
   * Returns the tooltip value of a data point. The tooltip uses the encoded
   * value when it returns undefined.
   */
  getSeriesValue?: SeriesValueGetter;
  getSeriesYAxisIndex?: SeriesYAxisIndexGetter;
  getSeriesStack?: SeriesStackGetter;
  getDatasetValue?: DatasetValueGetter;
}): TooltipComponentOption {
  return {
    trigger: "axis",
    confine: true,
    extraCssText: "font-size: 0.80rem;",
    backgroundColor: themeMode === "dark" ? "#2E2854" : "#FAFAFA",
    borderColor: themeMode === "dark" ? "#372779" : "#5D25D4",
    formatter: createTooltipFormater({
      currentSeriesRef,
      axes,
      themeMode,
      displayTotal,
      totalStack,
      totalColumn,
      totalLabel,
      currentPeriod,
      getSeriesValue,
      getSeriesYAxisIndex,
      getSeriesStack,
      getDatasetValue,
    }),
  };
}
