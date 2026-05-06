import { defineProject } from "vitest/config";

import { sharedProjectConfig } from "../../vitest.shared";

export default defineProject({
  ...sharedProjectConfig,
  test: {
    ...sharedProjectConfig.test,
    exclude: ["test/**/*.unit.test.ts"],
  },
});
