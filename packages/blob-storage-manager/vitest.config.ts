import { defineConfig, mergeConfig } from "vitest/config";

import { sharedProjectConfig } from "../../vitest.shared";

export default mergeConfig(
  sharedProjectConfig,
  defineConfig({
    test: {
      setupFiles: ["./setup.ts"],
    },
  })
);
