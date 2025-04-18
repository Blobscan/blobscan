import "./polyfill";
import fs from "fs";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { fixtures } from "./fixtures";
import { getAnvil } from "./services/anvil";
import { getPrisma } from "./services/prisma";

const { anvil, server } = getAnvil();
const prisma = getPrisma();

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(fixtures.systemDate);

  try {
    await anvil.start();
  } catch (err) {
    if (!(err as Error).message.includes("Address already in use")) {
      throw err;
    }
  }

  await server.start();
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

  await prisma
    .$disconnect()
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .finally(async () => {
      await anvil.stop();
    })
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .finally(async () => {
      await server.stop();
    });
});
