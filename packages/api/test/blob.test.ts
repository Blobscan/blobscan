import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import type { TRPCContext } from "../src/context";
import { createTestContext, runPaginationTestsSuite } from "./helpers";

type GetByIdInput = inferProcedureInput<AppRouter["blob"]["getByBlobId"]>;

describe("Blob router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    runPaginationTestsSuite("blob", (paginationInput) =>
      caller.blob.getAll(paginationInput).then(({ blobs }) => blobs)
    );

    it("should get the total number of blobs correctly", async () => {
      const expectedTotalBlobs = fixtures.blobsOnTransactions.length;

      await ctx.prisma.blobOverallStats.populate();
      await caller.blob.getAll();

      // FIXME: this should return the total amount of unique blobs
      const { totalBlobs } = await caller.blob.getAll({});

      expect(totalBlobs).toBe(expectedTotalBlobs);
    });
  });

  describe("getByBlobId", () => {
    it("should get a blob by versioned hash", async () => {
      const input: GetByIdInput = {
        id: "blobHash004",
      };

      const result = await caller.blob.getByBlobId(input);

      expect(result).toMatchSnapshot();
    });

    it("should get a blob by kzg commitment", async () => {
      const input: GetByIdInput = {
        id: "commitment004",
      };

      const result = await caller.blob.getByBlobId(input);

      expect(result).toMatchSnapshot();
    });

    it("should fail when trying to get a blob by a non-existent hash", async () => {
      await expect(
        caller.blob.getByBlobId({
          id: "nonExistingHash",
        })
      ).rejects.toMatchInlineSnapshot(
        "[TRPCError: No blob with versioned hash or kzg commitment 'nonExistingHash'.]"
      );
    });

    it("should fail when getting a blob and the blob data is not available", async () => {
      await expect(
        caller.blob.getByBlobId({
          id: "blobHash003",
        })
      ).rejects.toMatchInlineSnapshot(
        "[TRPCError: Failed to get blob from any of the storages: ]"
      );
    });
  });
});
