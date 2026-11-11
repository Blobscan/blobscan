import type { Category } from "~/types";
import type { ResourceDefinition } from "~/types/definition";

export const CATEGORY_COLORS: Record<Category, ResourceDefinition["color"]> = {
  rollup: { light: "#8DC1A9", dark: "#8DC1A9" },
  other: { light: "#A4A8B3", dark: "#9CA5B8" },
};
