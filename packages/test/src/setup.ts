import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { fixtures, loadFixtures, resetFixtures } from "./fixtures";

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(fixtures.systemDate);
});

beforeEach(async () => {
  await resetFixtures();

  await loadFixtures();
});

afterAll(() => {
  vi.useRealTimers();
});
