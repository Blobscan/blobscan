import { ROLLUP_STYLES } from "~/rollups";
import type { Rollup } from "~/types";
import { capitalize } from "~/utils";

export const DEFAULT_COLOR = "#505050";

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

function getCategoryRollupSeriesColor(
  seriesName: string,
  themeMode: "dark" | "light"
): string | undefined {
  if (seriesName === "other") {
    return DEFAULT_COLOR;
  }

  const rollupSettings = ROLLUP_STYLES[seriesName as Rollup];

  if (rollupSettings) {
    return rollupSettings.color[themeMode];
  }
}

export function getSeriesColor({
  seriesName,
  seriesIndex,
  themeMode,
}: {
  seriesName?: string;
  seriesIndex: number;
  themeMode: "dark" | "light";
}) {
  const defaultColor = DEFAULT_COLORS[seriesIndex % DEFAULT_COLORS.length];

  if (!seriesName) {
    return defaultColor;
  }

  return getCategoryRollupSeriesColor(seriesName, themeMode) ?? defaultColor;
}

export function inferSeriesName(id: string) {
  const [type, name] = id.split("-");

  if (!name && type === "global") {
    return "Total";
  }

  if (type === "rollup") {
    return ROLLUP_STYLES[name as Rollup].label;
  }

  return capitalize(name ?? "");
}
