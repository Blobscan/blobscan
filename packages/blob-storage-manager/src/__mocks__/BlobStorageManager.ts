import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

import type { BlobStorageManager } from "../BlobStorageManager";

beforeEach(() => {
  mockReset(blobStorageManager);
});

const blobStorageManager = mockDeep<BlobStorageManager>();
export default blobStorageManager;
