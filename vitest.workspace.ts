import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "clis/*/vitest.config.ts",
  "packages/*/vitest.config.ts",
  "apps/*/vitest.config.ts",
]);
