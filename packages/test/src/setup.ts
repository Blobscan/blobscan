import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { fixtures } from "./fixtures";
import { getPrisma } from "./services/prisma";

const prisma = getPrisma();

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(fixtures.systemDate);
});

beforeEach(async () => {
  await fixtures.reset(prisma);
  await fixtures.load(prisma);
});

afterAll(() => {
  vi.useRealTimers();
});
