import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    include: ["test/**/*.unit.test.ts"],
    threads: false,
  },
});
