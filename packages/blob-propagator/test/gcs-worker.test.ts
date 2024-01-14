import { describe, vi } from "vitest";

import { runStorageWorkerTestSuite } from "./helpers";

describe(
  "GCS Worker",
  runStorageWorkerTestSuite("GOOGLE", {
    runAfterAllFns() {
      vi.clearAllMocks();
    },
    fixtures: {
      blobData: "0x1234abcdeff123456789ab34223a4b2c2e",
      blobStorageReference: "70118930558/og/le/Wo/ogleWorkerVersionedHash.txt",
      blobVersionedHash: "googleWorkerVersionedHash",
    },
  })
);
