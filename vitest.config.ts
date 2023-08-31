import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
    threads: false,
    coverage: {
      enabled: true,
      reporter: ["html"],
    },
    onConsoleLog(log) {
      if (log.includes("Current logger will be overwritten")) return false;
      if (log.includes("storage enabled")) return false;
    },
  },
});
