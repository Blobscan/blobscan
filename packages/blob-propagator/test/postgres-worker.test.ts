import { describe, vi } from "vitest";

import { runStorageWorkerTestSuite } from "./helpers";

describe(
  "Postgres Worker",
  runStorageWorkerTestSuite("POSTGRES", {
    runBeforeAllFns() {
      vi.stubEnv("POSTGRES_STORAGE_ENABLED", "true");
    },
    runAfterAllFns() {
      vi.unstubAllEnvs();
    },
    fixtures: {
      blobData: "0x1234abcdeff123456789ab",
      blobStorageReference: "postgresWorkerVersionedHash",
      blobVersionedHash: "postgresWorkerVersionedHash",
    },
  })
);
