import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

import type { BlobscanPrismaClient } from "../index";

beforeEach(() => {
  mockReset(prisma);
});

const prisma = mockDeep<BlobscanPrismaClient>();

export default prisma;
