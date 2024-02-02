import { describe, vi } from "vitest";

import { runStorageWorkerTestSuite } from "./helpers";

describe(
  "Postgres Worker",
  runStorageWorkerTestSuite("POSTGRES", {
    fixtures: {
      blobData: "0x1234abcdeff123456789ab",
      blobStorageReference: "postgresWorkerVersionedHash",
      blobVersionedHash: "postgresWorkerVersionedHash",
    },
    runAfterAllFns() {
      vi.clearAllMocks();
    },
  })
);
