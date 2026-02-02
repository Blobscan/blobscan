import type { MutableRefObject } from "react";
import type { EChartOption } from "echarts";

import { calculatePercentage, getNeighbouringElements } from "~/utils";
import type { Numerish } from "~/utils";
import { aggregateValues } from "../../helpers";
import type { MetricInfo } from "../types";
import { formatMetricValue, formatSeriesName } from "./formatters";

type StandardEncoding = {
  x: number[];
  y: number[];
};

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

function getValue(param: EChartOption.Tooltip.Format) {
  const encode = param.encode;

  if (isStandardEncoding(encode)) {
    const dataIndex = encode.y[0];

    if (dataIndex !== undefined) {
      return param.data[dataIndex];
    }
  }

  if (Array.isArray(param.value)) {
    return param.value[1];
  }

  return param.value;
}

function buildSeriesHtmlElement({
  name,
  value,
  metricInfo,
  marker,
  markerColor,
  total,
  isSelected,
  themeMode,
}: {
  name: string;
  value?: Numerish;
  metricInfo: MetricInfo;
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
  const formattedValue = value
    ? formatMetricValue(value, metricInfo)
    : undefined;
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

function createTooltipFormater({
  currentSeriesRef,
  metricInfo: { xAxis: xAxisMetricInfo, yAxis: yAxisMetricInfo },
  themeMode,
  displayTotal,
}: {
  currentSeriesRef: MutableRefObject<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>;
  metricInfo: {
    xAxis: MetricInfo;
    yAxis: MetricInfo;
  };
  themeMode: "light" | "dark";
  displayTotal?: boolean;
}) {
  return (
    paramOrParams: EChartOption.Tooltip.Format | EChartOption.Tooltip.Format[]
  ) => {
    const seriesIndex = currentSeriesRef.current?.seriesIndex;

    let dateHTMLElement: string | undefined;
    const seriesHTMLElements: string[] = [];
    const totalSeriesHTMLElements: string[] = [];

    if (Array.isArray(paramOrParams)) {
      if (!paramOrParams.length) {
        return "Loading…";
      }

      const dailyTotal = displayTotal
        ? aggregateValues(
            paramOrParams.map((p) => getValue(p)) as number[],
            yAxisMetricInfo.type
          )
        : undefined;

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
      dateHTMLElement = date ? formatMetricValue(date, xAxisMetricInfo) : "-";

      filteredParams.map((p) => {
        const { seriesName, value, color } = p;
        const currentSeriesName = seriesName?.toLowerCase();

        if (!currentSeriesName || value === undefined) {
          return "";
        }

        const isSelected = displayTotal
          ? currentSeriesRef.current?.seriesName?.toLowerCase() ===
            currentSeriesName
          : undefined;

        const formattedName = formatSeriesName(seriesName);

        seriesHTMLElements.push(
          buildSeriesHtmlElement({
            name: formattedName,
            value: getValue(p),
            total: dailyTotal,
            metricInfo: yAxisMetricInfo,
            markerColor: color,
            themeMode,
            isSelected,
          })
        );
      });

      if (displayTotal) {
        if (rollupSeries.length) {
          const rollupTotal = aggregateValues(
            rollupSeries.map((p) => getValue(p)) as number[],
            yAxisMetricInfo.type
          );

          totalSeriesHTMLElements.push(
            buildSeriesHtmlElement({
              name: "Rollup",
              value: rollupTotal,
              metricInfo: yAxisMetricInfo,
              total: dailyTotal,
              themeMode,
            })
          );
        }

        totalSeriesHTMLElements.push(
          buildSeriesHtmlElement({
            name: "Total",
            value: dailyTotal,
            metricInfo: yAxisMetricInfo,
            themeMode,
          })
        );
      }
    } else {
      const { name, seriesName, value, color } = paramOrParams;

      const formattedName = formatSeriesName(seriesName);

      seriesHTMLElements.push(
        buildSeriesHtmlElement({
          name: formattedName,
          value: (value as number | string) ?? 0,
          metricInfo: yAxisMetricInfo,
          markerColor: color,
          isSelected: true,
          themeMode,
        })
      );

      dateHTMLElement = name
        ? formatMetricValue(name, xAxisMetricInfo).toString()
        : "-";
    }

    return `
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <div style="color: ${
              themeMode === "dark" ? "#FFFFFF" : "#171717"
            }; font-weight: bold;">
            ${dateHTMLElement}
            </div>
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
  metricInfo,
  themeMode,
}: {
  currentSeriesRef: MutableRefObject<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>;
  metricInfo: { xAxis: MetricInfo; yAxis: MetricInfo };
  displayTotal?: boolean;
  themeMode: "light" | "dark";
}): EChartOption.Tooltip {
  return {
    trigger: "axis",
    confine: true,
    extraCssText: "font-size: 0.80rem;",
    backgroundColor: themeMode === "dark" ? "#2E2854" : "#FAFAFA",
    borderColor: themeMode === "dark" ? "#372779" : "#5D25D4",
    formatter: createTooltipFormater({
      currentSeriesRef,
      metricInfo,
      themeMode,
      displayTotal,
    }),
  };
}
