// Shades of the primary color for the charts that show only global values.
// The values come from `baseColors.primary` in @blobscan/tailwind-config
// (tooling/tailwind/colors.ts). The main series uses the accent color of the
// theme (700 in light mode, 500 in dark mode). A second series has a very
// different intensity (350 in light mode, 700 in dark mode).
export const GLOBAL_MAIN_SERIES_COLOR = { light: "#5D25D4", dark: "#9A71F2" };
export const GLOBAL_SECONDARY_SERIES_COLOR = {
  light: "#C8AEFA",
  dark: "#5D25D4",
};
