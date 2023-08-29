import { describe, expect, it, vi } from "vitest";

import { buildGoogleStorageUri } from "./utils";

describe("buildGoogleStorageUri", () => {
  it("should return the correct URI for a given hash", () => {
    vi.stubEnv("CHAIN_ID", "1");

    const hash = "0x1234567890abcdef";
    const expectedUri = "1/12/34/56/1234567890abcdef.txt";

    const actualUri = buildGoogleStorageUri(hash);
    expect(actualUri).toEqual(expectedUri);
  });
});

describe("performPrismaOpInBatches", () => {
  it("should perform the given Prisma operation in batches", async () => {
    const BATCH_SIZE = 4;
    const elements = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const prismaOp = vi.fn();
    const performPrismaOpInBatches = vi
      .fn()
      .mockImplementation(function <T>(
        elements: T[],
        prismaOp: ({ data }: { data: T[] }) => Promise<{ count: number }>
      ) {
        const batches = Math.ceil(elements.length / BATCH_SIZE);
        const operations: Promise<{ count: number }>[] = [];

        Array.from({ length: batches }).forEach((_, index) => {
          const start = index * BATCH_SIZE;
          const end = start + BATCH_SIZE;

          operations.push(prismaOp({ data: elements.slice(start, end) }));
        });

        return Promise.all(operations);
      });

    await performPrismaOpInBatches(elements, prismaOp);

    expect(prismaOp).toHaveBeenCalledTimes(3);
    expect(prismaOp).toHaveBeenCalledWith({
      data: [1, 2, 3, 4],
    });
    expect(prismaOp).toHaveBeenCalledWith({
      data: [5, 6, 7, 8],
    });
    expect(prismaOp).toHaveBeenCalledWith({
      data: [9, 10],
    });
  });
});
