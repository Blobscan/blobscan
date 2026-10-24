import { defineProject } from "vitest/config";

// No shared setup file: these tests need no database, chain or Redis.
export default defineProject({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
