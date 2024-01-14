import { afterAll, beforeEach } from "vitest";

import { queueManager } from "./src/queue-manager";

beforeEach(async () => {
  await queueManager.obliterateQueues({ force: true });
});
afterAll(async () => {
  await queueManager
    .obliterateQueues({ force: true })
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .finally(() => queueManager.close());
});
