import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["@blobscan/test/src/helpers/setup.ts"],
    threads: false,
    coverage: {
      enabled: true,
      reporter: ["html"],
    },
    onConsoleLog(log) {
      if (log.includes("prisma:query")) return false;
      if (log.includes("Current logger will")) return false;
      if (log.includes("warn(prisma-client)")) return false;
      if (log.includes("<empty line>")) return false;
    },
  },
});
