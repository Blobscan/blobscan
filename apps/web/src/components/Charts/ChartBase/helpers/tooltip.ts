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

// The tooltip shows "-" for these values.
function hasDisplayableValue(value: Numerish | undefined): value is Numerish {
  return value !== undefined && value !== "" && Number(value) !== 0;
}

// The tooltip text uses this font. The column width calculation uses the same
// font to measure the text.
const TOOLTIP_FONT_FAMILY = "sans-serif";
const TOOLTIP_FONT_SIZE_REM = 0.8;
const PERCENTAGE_FONT_SIZE_REM = 0.7;

// The text of the value column of a series row. The row shows the percentage
// in a smaller font after the value.
function getSeriesValueText(
  value: Numerish | undefined,
  axis: Axis,
  total?: Numerish
) {
  return {
    formattedValue: value ? `${formatAxisValue(value, axis)}` : "-",
    percentage:
      value && total ? calculatePercentage(value, total).toFixed(2) : undefined,
  };
}

type SeriesRowContent = {
  name: string;
  value?: Numerish;
  total?: Numerish;
  isBold?: boolean;
};

/**
 * This type contains the minimum widths, in pixels, of the name column and the
 * value column of the series rows.
 */
type SeriesColumnWidths = {
  name: number;
  value: number;
};

type TextMeasurer = (
  text: string,
  fontSizeRem: number,
  isBold?: boolean
) => number;

let measureContext: CanvasRenderingContext2D | null | undefined;

// Returns undefined when the browser cannot measure text.
function createTextMeasurer(): TextMeasurer | undefined {
  if (typeof document === "undefined") {
    return;
  }

  if (measureContext === undefined) {
    measureContext = document.createElement("canvas").getContext("2d");
  }

  const context = measureContext;

  if (!context) {
    return;
  }

  const rootFontSize =
    parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  return (text, fontSizeRem, isBold) => {
    context.font = `${isBold ? "bold " : ""}${
      fontSizeRem * rootFontSize
    }px ${TOOLTIP_FONT_FAMILY}`;

    return context.measureText(text).width;
  };
}

// Calculate the column widths from all the rows of the hovered bar, not only
// from the rows that the tooltip shows. As a result, the tooltip width does not
// change when the user hovers from one series to a different series of the bar.
function getSeriesColumnWidths(
  rows: SeriesRowContent[],
  axis: Axis
): SeriesColumnWidths | undefined {
  const measureText = createTextMeasurer();

  if (!measureText) {
    return;
  }

  const widths = rows.reduce<SeriesColumnWidths>(
    (widths, { name, value, total, isBold }) => {
      const { formattedValue, percentage } = getSeriesValueText(
        value,
        axis,
        total
      );
      // The HTML puts a space between the value and the percentage.
      const percentageWidth = percentage
        ? measureText(" ", TOOLTIP_FONT_SIZE_REM, isBold) +
          measureText(`(${percentage}%)`, PERCENTAGE_FONT_SIZE_REM, isBold)
        : 0;

      return {
        name: Math.max(
          widths.name,
          measureText(name, TOOLTIP_FONT_SIZE_REM, isBold)
        ),
        value: Math.max(
          widths.value,
          measureText(formattedValue, TOOLTIP_FONT_SIZE_REM, isBold) +
            percentageWidth
        ),
      };
    },
    { name: 0, value: 0 }
  );

  return {
    name: Math.ceil(widths.name),
    value: Math.ceil(widths.value),
  };
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
  columnWidths,
}: {
  name: string;
  value?: Numerish;
  axis: Axis;
  marker?: string;
  markerColor?: string;
  total?: Numerish;
  isSelected?: boolean;
  themeMode?: "light" | "dark";
  columnWidths?: SeriesColumnWidths;
}) {
  const isDarkMode = themeMode === "dark";
  const { formattedValue, percentage } = getSeriesValueText(value, axis, total);
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
        <div style="${
          columnWidths ? `min-width: ${columnWidths.name}px;` : ""
        }">${name}</div>
      </div>
      <div style="color: ${isDarkMode ? "#A3A3A3" : "#404040"}; ${
    columnWidths ? `min-width: ${columnWidths.value}px; text-align: right;` : ""
  }">
        ${formattedValue}
        ${
          percentage
            ? `<span style="opacity: 0.4; font-size: ${PERCENTAGE_FONT_SIZE_REM}rem;">(${percentage}%)</span>`
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
  currentPeriod,
  getSeriesValue,
}: {
  currentSeriesRef: MutableRefObject<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>;
  axes: Axes;
  themeMode: "light" | "dark";
  displayTotal?: boolean;
  currentPeriod?: CurrentPeriod;
  getSeriesValue?: SeriesValueGetter;
}) {
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

      const dailyTotal = displayTotal
        ? aggregateValues(
            paramOrParams.map((p) => getValue(p, getSeriesValue)),
            axes.y.type
          )
        : undefined;

      const rollupSeries = paramOrParams.filter((d) =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (d.seriesId as string).includes("rollup")
      );
      const totalItems = 15;
      let filteredParams: DefaultLabelFormatterCallbackParams[];
      let columnWidths: SeriesColumnWidths | undefined;
      const summaryRows: SeriesRowContent[] = [];

      if (displayTotal) {
        // Dimensional charts: show only the series that have a value in the
        // hovered bar, from the largest value to the smallest value.
        const sortedSeries = paramOrParams
          .map((p) => ({ param: p, value: getValue(p, getSeriesValue) }))
          .filter(({ value }) => hasDisplayableValue(value))
          .sort((a, b) => Number(b.value) - Number(a.value));
        const sortedParams = sortedSeries.map(({ param }) => param);

        if (rollupSeries.length) {
          summaryRows.push({
            name: "Rollup",
            value: aggregateValues(
              rollupSeries.map((p) => getValue(p, getSeriesValue)),
              axes.y.type
            ),
            total: dailyTotal,
            isBold: true,
          });
        }

        summaryRows.push({ name: "Total", value: dailyTotal, isBold: true });

        columnWidths = getSeriesColumnWidths(
          [
            ...sortedSeries.map(({ param, value }) => ({
              name: formatSeriesName(param.seriesName),
              value,
              total: dailyTotal,
            })),
            ...summaryRows,
          ],
          axes.y
        );

        const hoveredIndex = sortedParams.findIndex(
          (p) => p.seriesIndex === seriesIndex
        );

        filteredParams =
          hoveredIndex >= 0
            ? getNeighbouringElements(sortedParams, hoveredIndex, totalItems)
            : sortedParams.slice(0, totalItems);
      } else {
        filteredParams =
          seriesIndex != null
            ? getNeighbouringElements(paramOrParams, seriesIndex, totalItems)
            : paramOrParams.slice(-10); // fallback if no hovered series
      }

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
            total: dailyTotal,
            axis: axes.y,
            markerColor: typeof color === "string" ? color : undefined,
            themeMode,
            isSelected,
            columnWidths,
          })
        );
      });

      summaryRows.forEach(({ name, value, total }) => {
        totalSeriesHTMLElements.push(
          buildSeriesHTMLElement({
            name,
            value,
            total,
            axis: axes.y,
            themeMode,
            columnWidths,
          })
        );
      });
    } else {
      const { name, seriesName, value, color } = paramOrParams;

      const formattedName = formatSeriesName(seriesName);

      seriesHTMLElements.push(
        buildSeriesHTMLElement({
          name: formattedName,
          value: (value as number | string) ?? 0,
          axis: axes.y,
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
              ${(displayTotal
                ? seriesHTMLElements
                : seriesHTMLElements.reverse()
              ).join("\n")}
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
  axes,
  themeMode,
  currentPeriod,
  getSeriesValue,
}: {
  currentSeriesRef: MutableRefObject<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>;
  axes: Axes;
  displayTotal?: boolean;
  themeMode: "light" | "dark";
  currentPeriod?: CurrentPeriod;
  /**
   * Returns the tooltip value of a data point. The tooltip uses the encoded
   * value when it returns undefined.
   */
  getSeriesValue?: SeriesValueGetter;
}): TooltipComponentOption {
  return {
    trigger: "axis",
    confine: true,
    extraCssText: `font-size: ${TOOLTIP_FONT_SIZE_REM}rem;`,
    textStyle: { fontFamily: TOOLTIP_FONT_FAMILY },
    backgroundColor: themeMode === "dark" ? "#2E2854" : "#FAFAFA",
    borderColor: themeMode === "dark" ? "#372779" : "#5D25D4",
    formatter: createTooltipFormater({
      currentSeriesRef,
      axes,
      themeMode,
      displayTotal,
      currentPeriod,
      getSeriesValue,
    }),
  };
}
