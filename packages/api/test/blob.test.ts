import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { fixtures } from "@blobscan/test";

import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import type { TRPCContext } from "../src/context";
import { getContext, runPaginationTestsSuite } from "./helpers";

type GetByHashInput = inferProcedureInput<
  AppRouter["blob"]["getByVersionedHash"]
>;

vi.mock("@blobscan/blob-storage-manager/src/env", () => ({
  env: {
    CHAIN_ID: 7011893058,
    POSTGRES_STORAGE_ENABLED: true,
    GOOGLE_STORAGE_ENABLED: true,
    GOOGLE_STORAGE_PROJECT_ID: "blobscan-test-project",
    GOOGLE_STORAGE_BUCKET_NAME: "blobscan-test-bucket",
    GOOGLE_STORAGE_API_ENDPOINT: "http://localhost:4443",
  },
}));

describe("Blob router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await getContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    runPaginationTestsSuite("blob", (paginationInput) =>
      caller.blob.getAll(paginationInput).then(({ blobs }) => blobs)
    );

    it("should get the total number of blobs correctly", async () => {
      const expectedTotalBlobs = fixtures.blobsOnTransactions.length;

      await ctx.prisma.blobOverallStats.backfill();
      await caller.blob.getAll();

      // FIXME: this should return the total amount of unique blobs
      const { totalBlobs } = await caller.blob.getAll({});

      expect(totalBlobs).toBe(expectedTotalBlobs);
    });
  });

  describe("getByVersionedHash", () => {
    it("should get a blob by versioned hash", async () => {
      const input: GetByHashInput = {
        versionedHash: "blobHash004",
      };

      const result = await caller.blob.getByVersionedHash(input);

      expect(result).toMatchSnapshot();
    });

    it("should fail when trying to get a blob by a non-existent hash", async () => {
      await expect(
        caller.blob.getByVersionedHash({
          versionedHash: "nonExistingHash",
        })
      ).rejects.toMatchInlineSnapshot(
        "[TRPCError: No blob with hash nonExistingHash found]"
      );
    });

    it("should fail when getting a blob and the blob data is not available", async () => {
      await expect(
        caller.blob.getByVersionedHash({
          versionedHash: "blobHash003",
        })
      ).rejects.toMatchInlineSnapshot(
        "[TRPCError: Failed to get blob from any of the storages: ]"
      );
    });
  });
});
