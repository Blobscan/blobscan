import { UserProjectConfigExport } from "vitest/config";

export const sharedProjectConfig: UserProjectConfigExport = {
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["@blobscan/test/src/setup.ts"],
    threads: false,
  },
};
