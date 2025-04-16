import { ROLLUP_REGISTRY } from "@blobscan/rollups";

import type { Rollup } from "~/types";

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
    return "#505050";
  }

  const rollupSettings = ROLLUP_REGISTRY[seriesName as Rollup];

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
