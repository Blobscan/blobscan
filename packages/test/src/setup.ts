import "./polyfill";
import fs from "fs";
import { Readable } from "stream";
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

vi.mock("@aws-sdk/client-s3", async (originalImport) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await originalImport<typeof import("@aws-sdk/client-s3")>();
  const storage: Record<string, Uint8Array> = {};

  return {
    S3Client: vi.fn().mockImplementation((_) => {
      return {
        send(
          c:
            | typeof original.GetObjectCommand
            | typeof original.PutObjectCommand
            | typeof original.DeleteObjectCommand
            | typeof original.HeadBucketCommand
        ) {
          if (c instanceof original.HeadBucketCommand) {
            if (c.input.Bucket !== "blobscan-s3-bucket") {
              throw new Error("No such bucket");
            }

            return;
          }

          if (c instanceof original.GetObjectCommand) {
            const binaryData = storage[c.input.Key as string];

            if (!binaryData) {
              throw new Error("no such key exists");
            }
            return {
              Body: binaryData ? Readable.from(binaryData) : undefined,
            };
          }

          if (c instanceof original.PutObjectCommand) {
            if (Buffer.isBuffer(c.input.Body)) {
              const binaryData = new Uint8Array(c.input.Body);
              storage[c.input.Key as string] = binaryData;
            }
          }

          if (c instanceof original.DeleteObjectCommand) {
            if (storage[c.input.Key as string]) {
              delete storage[c.input.Key as string];
            }
          }
        },
      };
    }),
    GetObjectCommand: original.GetObjectCommand,
    PutObjectCommand: original.PutObjectCommand,
    DeleteObjectCommand: original.DeleteObjectCommand,
    HeadBucketCommand: original.HeadBucketCommand,
  };
});

afterAll(async () => {
  vi.useRealTimers();
  vi.clearAllMocks();

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
