import type { SeriesOption } from "echarts";

import { ROLLUP_STYLES } from "~/rollups";
import type { Rollup, TimeseriesDimension } from "~/types";

export const DEFAULT_SERIES_COLOR = "#505050";

const DEFAULT_COLORS = [
  "#7289ab",
  "#8dc1a9",
  "#759aa0",
  "#dd6b66",
  "#eedd78",
  "#e69d87",
  "#ea7e53",
  "#73a373",
  "#73b9bc",
  "#91ca8c",
  "#f49f42",
];

export function getDefaultSeriesColor(seriesIndex: number) {
  return DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length];
}

export function createBaseSeriesOptions(seriesIndex: number) {
  return {
    smooth: true,
    itemStyle: {
      color: getDefaultSeriesColor(seriesIndex),
    },
    animationDelay: function (idx) {
      return idx * 2;
    },
    emphasis: {
      focus: "series",
    },
  } satisfies SeriesOption;
}

export function getDimensionColor(
  dimension: TimeseriesDimension,
  themeMode: "dark" | "light"
): string | undefined {
  switch (dimension.type) {
    case "global":
      return DEFAULT_COLORS[0];
    case "category": {
      switch (dimension.name) {
        case "other":
          return "#505050";
        case "rollup":
          return DEFAULT_COLORS[1];
      }

      break;
    }
    case "rollup": {
      const rollupSettings = ROLLUP_STYLES[dimension.name as Rollup];

      if (rollupSettings) {
        return rollupSettings.color[themeMode];
      }

      break;
    }
    default:
      break;
  }
}
