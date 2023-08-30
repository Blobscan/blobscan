import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["@blobscan/test/src/helpers/setup.ts"],
    threads: false,
    onConsoleLog(log) {
      if (log.includes("prisma:query")) return false;
      if (log.includes("Current logger will be overwritten")) return false;
    },
  },
});
