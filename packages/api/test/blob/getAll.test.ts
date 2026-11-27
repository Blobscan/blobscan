import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import {
  createTestContext,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "../helpers";
import { aggregateMetrics } from "../metrics";
import type { BlobCaller } from "./caller";
import { createBlobCaller } from "./caller";

describe("getAll", () => {
  let blobCaller: BlobCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    blobCaller = createBlobCaller(ctx);
  });

  beforeEach(async () => {
    await aggregateMetrics(ctx.prisma);
  });

  runPaginationTestsSuite("blob", (paginationInput) =>
    blobCaller
      .getAllByCursor(paginationInput)
      .then(({ blobs, totalBlobs, pagination }) => ({
        items: blobs,
        pagination,
        totalItems: totalBlobs,
      }))
  );

  runFiltersTestsSuite("blob", (baseGetAllInput) =>
    blobCaller.getAllByCursor(baseGetAllInput).then(({ blobs }) => blobs)
  );

  runExpandsTestsSuite("blob", ["block", "transaction"], (input) =>
    blobCaller.getAllByCursor(input).then(({ blobs }) => blobs)
  );

  describe("when filtering by blob", () => {
    const position = ({ txHash, index }: { txHash: string; index: number }) =>
      `${txHash}:${index}`;

    it("should return only the transactions of the blob", async () => {
      const { blobs } = await blobCaller.getAllByCursor({
        blob: "blobHash001",
        ps: 100,
      });

      expect(blobs.length).toBeGreaterThan(1);
      expect(
        blobs.every(({ versionedHash }) => versionedHash === "blobHash001")
      ).toBe(true);
    });

    it("should page through every transaction of the blob once, and count them", async () => {
      const { blobs: all, totalBlobs } = await blobCaller.getAllByCursor({
        blob: "blobHash001",
        ps: 100,
        count: true,
      });
      const paged: string[] = [];
      let cursor: string | undefined;

      do {
        const page = await blobCaller.getAllByCursor({
          blob: "blobHash001",
          ps: 5,
          cursor,
        });

        paged.push(...page.blobs.map(position));
        cursor = page.pagination.nextCursor ?? undefined;
      } while (cursor);

      expect(totalBlobs).toBe(all.length);
      expect(paged).toEqual(all.map(position));
    });
  });
});
