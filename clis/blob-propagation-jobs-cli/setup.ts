import { afterAll, beforeEach } from "vitest";

import { context } from "./src/context-instance";

beforeEach(async () => {
  await context.clearQueues();
});

afterAll(async () => {
  await context
    .clearQueues()
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .finally(() => context.close());
});
