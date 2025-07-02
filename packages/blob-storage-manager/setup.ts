import { Readable } from "stream";
import { afterAll, vi } from "vitest";

import { SWARM_REFERENCE } from "./test/fixtures";

vi.mock("@ethersphere/bee-js", async (importOriginal) => {
  const blobBatches: Record<string, { reference: string; data: string }[]> = {
    ["mock-batch-id"]: [],
  };

  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import("@ethersphere/bee-js")>();
  return {
    Bee: vi.fn().mockImplementation((endpoint) => {
      return {
        url: endpoint,
        checkConnection: vi.fn().mockImplementation(() => {
          return {
            status: "ok",
          };
        }),
        downloadFile: vi.fn().mockImplementation((reference) => {
          const batch = blobBatches["mock-batch-id"];

          if (!batch) {
            throw new Error("Batch not found");
          }

          const file = batch.find((b) => b.reference === reference);

          if (file) {
            return {
              data: {
                toHex() {
                  return "0x12bc45f2a2";
                },
              },
            };
          }

          throw new Error("File not found");
        }),
        uploadFile: vi.fn().mockImplementation((batchId, blobData) => {
          const batch = blobBatches[batchId];
          if (batch) {
            batch.push({ data: blobData, reference: SWARM_REFERENCE });
          }

          return {
            reference: {
              toHex() {
                return SWARM_REFERENCE;
              },
            },
          };
        }),
        unpin: vi.fn().mockImplementation((_) => {
          const batch = blobBatches["mock-batch-id"];

          if (!batch) {
            throw new Error("Batch not found");
          }

          blobBatches["mock-batch-id"] = [];
        }),
      };
    }),
    BeeResponseError: original.BeeResponseError,
  };
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
afterAll(() => {
  vi.clearAllMocks();
});
