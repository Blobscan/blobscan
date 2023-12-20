import { UserWorkspaceConfig } from "vitest/config";

export const sharedProjectConfig: UserWorkspaceConfig = {
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["@blobscan/test/src/setup.ts"],
    threads: false,
  },
};
