import fs from "fs";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { fixtures } from "./fixtures";
import { getPrisma } from "./services/prisma";

const prisma = getPrisma();

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(fixtures.systemDate);
});

beforeEach(async () => {
  await fixtures.create(prisma);
});

afterAll(async () => {
  vi.useRealTimers();

  if (
    process.env.FILE_SYSTEM_STORAGE_PATH &&
    fs.existsSync(process.env.FILE_SYSTEM_STORAGE_PATH)
  ) {
    fs.rmSync(process.env.FILE_SYSTEM_STORAGE_PATH, { recursive: true });
  }

  await prisma.$disconnect();
});
