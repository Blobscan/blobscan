import { TRPCError } from "@trpc/server";
import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { DailyStats, Prisma } from "@blobscan/db";
import { fixtures, testValidError } from "@blobscan/test";

import { BlobStorage } from "../enums";
import type { Rollup } from "../enums";
import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import type { TRPCContext } from "../src/context";
import {
  createTestContext,
  generateDailyCounts,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
  unauthorizedRPCCallTest,
} from "./helpers";
import {
  getFilteredBlobs,
  requiresDirectCount,
  runFilterTests,
} from "./test-suites/filters";
import { blobIdSchemaTestsSuite } from "./test-suites/schemas";

type GetByIdInput = inferProcedureInput<AppRouter["blob"]["getByBlobId"]>;

describe("Blob router", () => {
  let authorizedCaller: ReturnType<typeof appRouter.createCaller>;
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;
  let authorizedContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    authorizedContext = await createTestContext({
      apiClient: { type: "weavevm" },
    });
    ctx = await createTestContext();

    authorizedCaller = appRouter.createCaller(authorizedContext);
    caller = appRouter.createCaller(ctx);
  });

  describe("createWeaveVmReferences", () => {
    const blobHashes = ["blobHash001", "blobHash002", "blobHash003"];
    const where = {
      AND: [
        {
          blobHash: {
            in: blobHashes,
          },
        },
        {
          blobStorage: BlobStorage.WEAVEVM,
        },
      ],
    };

    describe("when authorized", () => {
      it("should insert references correctly", async () => {
        const blobReferencesBefore =
          await ctx.prisma.blobDataStorageReference.findMany({
            where,
          });

        expect(
          blobReferencesBefore,
          "There should be no blob weavevm references initially"
        ).toEqual([]);

        await authorizedCaller.blob.createWeaveVMReferences({
          blobHashes,
        });

        const blobReferencesAfter = await ctx.prisma.blobDataStorageReference
          .findMany({
            where,
          })
          .then((refs) =>
            refs
              .map(({ blobHash }) => blobHash)
              .sort((a, b) => a.localeCompare(b))
          );

        expect(
          blobReferencesAfter,
          "References should have been inserted"
        ).toEqual(blobHashes.sort((a, b) => a.localeCompare(b)));
      });

      it("should skip already existing references correctly", async () => {
        await ctx.prisma.blobDataStorageReference.createMany({
          data: blobHashes.map((blobHash) => ({
            blobHash,
            blobStorage: BlobStorage.WEAVEVM,
            dataReference: blobHash,
          })),
        });

        await authorizedCaller.blob.createWeaveVMReferences({
          blobHashes,
        });

        const blobReferencesAfter = await ctx.prisma.blobDataStorageReference
          .findMany({
            where,
          })
          .then((refs) =>
            refs
              .map(({ blobHash }) => blobHash)
              .sort((a, b) => a.localeCompare(b))
          );

        expect(blobReferencesAfter).toEqual(
          blobHashes.sort((a, b) => a.localeCompare(b))
        );
      });

      it("should be called with an empty blob hashes array correctly", async () => {
        await expect(
          authorizedCaller.blob.createWeaveVMReferences({
            blobHashes: [],
          })
        ).resolves.toBeUndefined();
      });

      testValidError(
        "should fail when one or more provided blobs do not exist",
        async () => {
          await authorizedCaller.blob.createWeaveVMReferences({
            blobHashes: ["nonExistingBlobHash"],
          });
        },
        TRPCError,
        {
          checkCause: true,
        }
      );

      unauthorizedRPCCallTest(() =>
        caller.blob.createWeaveVMReferences({
          blobHashes,
        })
      );
    });
  });

  describe("getAll", () => {
    beforeEach(async () => {
      await ctx.prisma.overallStats.aggregate();
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
    // To test that the procedure retrieves the count from the stats table rather than
    // performing a direct database count, we stored an arbitrary total blobs value in the stats table
    // in each test, intentionally different from the actual number of blobs in the database.
    // This setup allows us to verify that the procedure correctly uses the stats table count
    // instead of performing a direct database count.
    const STATS_TOTAL_BLOBS = 999999;

    async function createNewDailyStats(dailyStats: Partial<DailyStats>) {
      const data: Prisma.DailyStatsCreateInput = {
        day: new Date(),
        category: null,
        rollup: null,
        totalBlobs: 0,
        totalBlobSize: 0,
        totalUniqueBlobs: 0,
        ...dailyStats,
      };

      await ctx.prisma.dailyStats.create({
        data,
      });
    }

    it("should return the overall total blobs stat when no filters are provided", async () => {
      const expectedTotalBlobs = STATS_TOTAL_BLOBS;

      await ctx.prisma.overallStats.create({
        data: {
          category: null,
          rollup: null,
          totalBlobs: expectedTotalBlobs,
        },
      });
      const { totalBlobs } = await caller.blob.getCount({});

      expect(totalBlobs).toBe(expectedTotalBlobs);
    });

    runFilterTests(async (queryParamFilters) => {
      const directCountRequired = requiresDirectCount(queryParamFilters);
      let expectedTotalBlobs = 0;

      if (directCountRequired) {
        expectedTotalBlobs = getFilteredBlobs(queryParamFilters).length;
      } else {
        const rollups = queryParamFilters.rollups
          ?.split(",")
          .map((r) => r.toUpperCase() as Rollup);

        const { startDate, endDate } = queryParamFilters;
        const dateFilterEnabled = startDate || endDate;

        if (dateFilterEnabled) {
          const dailyCounts = generateDailyCounts(
            { from: startDate, to: endDate },
            STATS_TOTAL_BLOBS
          );
          expectedTotalBlobs = dailyCounts.reduce(
            (acc, { count }) => acc + count,
            0
          );

          if (rollups?.length) {
            await Promise.all(
              rollups.map((r) =>
                dailyCounts.map(({ day, count }) =>
                  createNewDailyStats({
                    day,
                    totalBlobs: count,
                    category: null,
                    rollup: r,
                  })
                )
              )
            );
          }

          await Promise.all(
            dailyCounts.map(({ day, count }) =>
              createNewDailyStats({
                day,
                category: null,
                rollup: null,
                totalBlobs: count,
              })
            )
          );
        } else {
          expectedTotalBlobs = STATS_TOTAL_BLOBS;

          if (rollups?.length) {
            await Promise.all(
              rollups.map((r) =>
                ctx.prisma.overallStats.create({
                  data: {
                    totalBlobs: expectedTotalBlobs,
                    category: null,
                    rollup: r,
                  },
                })
              )
            );
          }

          await ctx.prisma.overallStats.create({
            data: {
              category: null,
              rollup: null,
              totalBlobs: expectedTotalBlobs,
            },
          });
        }
      }

      const { totalBlobs } = await caller.blob.getCount(queryParamFilters);

      expect(totalBlobs).toBe(expectedTotalBlobs);
    });
  });
});
