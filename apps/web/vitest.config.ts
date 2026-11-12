import path from "path";
import { defineProject } from "vitest/config";

export default defineProject({
  esbuild: { jsx: "automatic" },
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
    fileParallelism: false,
    maxWorkers: 1,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
});
