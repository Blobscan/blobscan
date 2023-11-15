import { afterAll, beforeAll, describe, vi } from "vitest";

import { runStorageWorkerTestSuite } from "./helpers";

describe(
  "GCS Worker",
  runStorageWorkerTestSuite("GOOGLE", {
    runBeforeAllFns() {
      beforeAll(() => {
        vi.stubEnv("CHAIN_ID", "70118930558");
        vi.stubEnv("GOOGLE_STORAGE_ENABLED", "false");
        vi.stubEnv("GOOGLE_STORAGE_BUCKET", "blobscan-test-bucket");
        vi.stubEnv("GOOGLE_STORAGE_PROJECT_ID", "blobscan-test-project");
        vi.stubEnv("GOOGLE_STORAGE_API_ENDPOINT", "http://localhost:4443");
      });
    },
    runAfterAllFns() {
      afterAll(() => {
        vi.unstubAllEnvs();
      });
    },
    fixtures: {
      blobData: "0x1234abcdeff123456789ab34223a4b2c2e",
      blobStorageReference: "70118930558/og/le/Wo/ogleWorkerVersionedHash.txt",
      blobVersionedHash: "googleWorkerVersionedHash",
    },
  })
);
