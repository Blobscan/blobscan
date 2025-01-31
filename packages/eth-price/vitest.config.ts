import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 5 * 60 * 1_000,
    reporters: ["verbose"],
  },
});
