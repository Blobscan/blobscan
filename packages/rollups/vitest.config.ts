import { defineProject } from "vitest/config";

export default defineProject({
  test: { name: "rollups", include: ["test/**/*.test.ts"] },
});
