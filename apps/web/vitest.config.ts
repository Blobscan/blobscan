import path from "path";
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    include: ["test/**/*.test.ts"],
    fileParallelism: false,
    maxWorkers: 1,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
});
