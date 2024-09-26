import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import type { TRPCContext } from "../src/context";
import {
  createTestContext,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "./helpers";
import { getFilteredBlobs, runFilterTests } from "./test-suites/filters";
import { blobIdSchemaTestsSuite } from "./test-suites/schemas";

type GetByIdInput = inferProcedureInput<AppRouter["blob"]["getByBlobId"]>;

describe("Blob router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    beforeEach(async () => {
      await ctx.prisma.blobOverallStats.populate();
    });

    runPaginationTestsSuite("blob", (paginationInput) =>
      caller.blob.getAll(paginationInput).then(({ blobs, totalBlobs }) => ({
        items: blobs,
        totalItems: totalBlobs,
      }))
    );

    runFiltersTestsSuite("blob", (baseGetAllInput) =>
      caller.blob.getAll(baseGetAllInput).then(({ blobs }) => blobs)
    );

    runExpandsTestsSuite("blob", ["block", "transaction"], (input) =>
      caller.blob.getAll(input).then(({ blobs }) => blobs)
    );
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
      ).rejects.toMatchSnapshot();
    });

    it("should fail when getting a blob and the blob data is not available", async () => {
      const blobHash = "blobHash006";

      await ctx.prisma.blobData.delete({
        where: {
          id: blobHash,
        },
      });

      await expect(
        caller.blob.getByBlobId({
          id: blobHash,
        })
      ).rejects.toMatchSnapshot();
    });
  });

  describe("getBlobDataByBlobId", () => {
    const versionedHash =
      "0x01f433be851da7e34bf14bf4f21b4c7db4b38afee7ec74d3c576fdce9f8f6734";
    const unprefixedBlobData = fixtures.blobDatas
      .find((d) => d.id === versionedHash)
      ?.data.toString("hex");
    const expectedBlobData = `0x${unprefixedBlobData}`;

    it("should get data by versioned hash", async () => {
      const result = await caller.blob.getBlobDataByBlobId({
        id: versionedHash,
      });

      expect(result).toEqual(expectedBlobData);
    });

    it("should get data by kzg commitment", async () => {
      const commitment =
        "0x8c5b4383c1db58dc3f615ee8a1fdeb2a1ad19d1f26d72119c23b36b5df30ea4be9d55ccb9254f7a7993d23a78bd858ce";

      const result = await caller.blob.getBlobDataByBlobId({
        id: commitment,
      });

      expect(result).toEqual(expectedBlobData);
    });

    blobIdSchemaTestsSuite(async (invalidBlobId) => {
      await caller.blob.getBlobDataByBlobId({
        id: invalidBlobId,
      });
    });
  });

  describe("getCount", () => {
    it("should return the overall total blobs stat when no filters are provided", async () => {
      await ctx.prisma.blobOverallStats.increment({
        from: 0,
        to: 9999,
      });
      const { totalBlobs } = await caller.blob.getCount({});

      expect(totalBlobs).toBe(fixtures.canonicalBlobs.length);
    });

    runFilterTests(async (filters) => {
      const { totalBlobs } = await caller.blob.getCount(filters);

      expect(totalBlobs).toBe(getFilteredBlobs(filters).length);
    });
  });
});
