import { defineProject } from "vitest/config";
import path from "path";

export default defineProject({
  test: {
    include: ["test/**/*.test.ts"],
    threads: false,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
});
