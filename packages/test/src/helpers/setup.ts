import { beforeEach } from "vitest";

import loadFixture from "./load-fixture";
import resetFixture from "./reset-fixture";

beforeEach(async () => {
  await resetFixture();

  await loadFixture();
});
