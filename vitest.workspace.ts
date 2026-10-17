import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "clis/*/vitest.config.ts",
  "packages/*/vitest.config.ts",
  "apps/rest-api-server/vitest.config.ts",
]);
