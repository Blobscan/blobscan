import { afterEach, beforeEach } from "vitest";

import loadFixture from "./load-fixture";
import resetDb from "./reset-db";

beforeEach(async () => {
  await resetDb();

  await loadFixture();
});

afterEach(async () => {
  await resetDb();
});
