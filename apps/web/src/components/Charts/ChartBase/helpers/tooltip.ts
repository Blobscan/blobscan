import type { MutableRefObject } from "react";
import type { EChartOption } from "echarts";

import { ROLLUP_REGISTRY } from "@blobscan/rollups";

import type { Rollup } from "~/types";
import {
  calculatePercentage,
  capitalize,
  getNeighbouringElements,
  normalizeNumerish,
} from "~/utils";
import type { Numerish } from "~/utils";
import type { MetricInfo } from "../types";
import { formatMetricValue } from "./formatters";

function getTotal(data: number[] | string[], { type }: MetricInfo) {
  if (!data.length) {
    return 0;
  }

  const value = data[0] ? normalizeNumerish(data[0]) : undefined;

  if (!value) {
    return 0;
  }

  if (type === "count") {
    if (typeof value === "number") {
      return data.reduce<number>((acc, value) => acc + Number(value), 0);
    }

    return data.reduce((acc, value) => acc + BigInt(value), BigInt(0));
  }

  if (type === "average") {
    if (typeof value === "number") {
      const total = data.reduce<number>((acc, value) => acc + Number(value), 0);

      return total / data.length;
    }

    const total = data.reduce((acc, value) => acc + BigInt(value), BigInt(0));

    return total / BigInt(data.length);
  }

  throw new Error("Invalid data type");
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
        <div>${capitalize(name)}</div>
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

export function createTooltip({
  currentSeriesRef,
  displayTotal,
  metricInfo: { xAxis: xAxisMetricInfo, yAxis: yAxisMetricInfo },
  themeMode,
  opts,
}: {
  currentSeriesRef: MutableRefObject<{
    seriesIndex?: number;
    seriesName?: string;
  } | null>;
  metricInfo: { xAxis: MetricInfo; yAxis: MetricInfo };
  displayTotal?: boolean;
  themeMode: "light" | "dark";
  opts?: EChartOption.Tooltip;
}): EChartOption.Tooltip {
  return {
    trigger: "axis",
    confine: true,
    extraCssText: "font-size: 0.80rem;",
    backgroundColor: themeMode === "dark" ? "#2E2854" : "#FAFAFA",
    borderColor: themeMode === "dark" ? "#372779" : "#5D25D4",
    formatter: (paramOrParams) => {
      const seriesIndex = currentSeriesRef.current?.seriesIndex;

      let dateHTMLElement: string | undefined;
      const seriesHTMLElements: string[] = [];
      const totalSeriesHTMLElements: string[] = [];

      if (Array.isArray(paramOrParams)) {
        if (!paramOrParams.length) {
          return "Loading…";
        }

        const dayTotal = displayTotal
          ? getTotal(
              paramOrParams.map((p) => p.value ?? 0) as string[] | number[],
              yAxisMetricInfo
            )
          : undefined;
        const rollupSeries = paramOrParams.filter(
          (d) => !!ROLLUP_REGISTRY[d.seriesName as Rollup]
        );
        const totalItems = 15;
        const filteredParams =
          seriesIndex != null
            ? getNeighbouringElements(paramOrParams, seriesIndex, totalItems)
            : paramOrParams.slice(0, 10); // fallback if no hovered series

        const { name } = paramOrParams[0] || {};

        dateHTMLElement = name
          ? formatMetricValue(name, xAxisMetricInfo).toString()
          : "-";

        filteredParams.map((p) => {
          const { seriesName, value, color } = p;
          const currentSeriesName = seriesName?.toLowerCase();

          if (
            !currentSeriesName ||
            value === undefined ||
            Array.isArray(value)
          ) {
            return "";
          }

          const isSelected = displayTotal
            ? currentSeriesRef.current?.seriesName?.toLowerCase() ===
              currentSeriesName
            : undefined;

          seriesHTMLElements.push(
            buildSeriesHtmlElement({
              name: seriesName ?? "Total",
              value: value,
              total: dayTotal,
              metricInfo: yAxisMetricInfo,
              markerColor: color,
              themeMode,
              isSelected,
            })
          );
        });

        if (displayTotal) {
          if (rollupSeries.length) {
            const rollupTotal = getTotal(
              rollupSeries.map((p) => p.value ?? 0) as string[] | number[],
              yAxisMetricInfo
            );

            totalSeriesHTMLElements.push(
              buildSeriesHtmlElement({
                name: "Rollup",
                value: rollupTotal,
                metricInfo: yAxisMetricInfo,
                total: dayTotal,
                themeMode,
              })
            );
          }

          totalSeriesHTMLElements.push(
            buildSeriesHtmlElement({
              name: "Total",
              value: dayTotal,
              metricInfo: yAxisMetricInfo,
              themeMode,
            })
          );
        }
      } else {
        const { name, seriesName, value, color } = paramOrParams;

        seriesHTMLElements.push(
          buildSeriesHtmlElement({
            name: seriesName ?? "Total",
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
    },
    ...(opts ?? {}),
  };
}
