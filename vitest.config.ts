import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "json", "html"],
    },
    onConsoleLog(log) {
      if (log.includes("prisma:query")) return false;
      if (log.includes("warn(prisma-client)")) return false;
      if (log.includes("<empty line>")) return false;
      if (log.includes("Current logger will be overwritten")) return false;
      if (log.includes("storage enabled")) return false;
    },
  },
});
