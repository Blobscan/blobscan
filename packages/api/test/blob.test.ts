import { TRPCError } from "@trpc/server";
import type { inferProcedureInput } from "@trpc/server";
import fs from "fs";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { BlobDataStorageReference } from "@blobscan/db";
import { prisma } from "@blobscan/db";
import type { DailyStats, Prisma } from "@blobscan/db";
import { BlobStorage } from "@blobscan/db/prisma/enums";
import type { Rollup } from "@blobscan/db/prisma/enums";
import { fixtures, testValidError } from "@blobscan/test";

import type { TRPCContext } from "../src/context";
import { blobRouter } from "../src/routers/blob";
import type { getByBlobId } from "../src/routers/blob/getByBlobId";
import { bytesToHex, hexToBytes } from "../src/utils";
import { buildBlobDataUrl } from "../src/utils/transformers";
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

type GetByIdInput = inferProcedureInput<typeof getByBlobId>;

describe("Blob router", () => {
  let authorizedBlobCaller: ReturnType<typeof blobRouter.createCaller>;
  let blobCaller: ReturnType<typeof blobRouter.createCaller>;
  let ctx: TRPCContext;
  let authorizedContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    authorizedContext = await createTestContext({
      apiClient: { type: "weavevm" },
    });
    ctx = await createTestContext();

    authorizedBlobCaller = blobRouter.createCaller(authorizedContext);
    blobCaller = blobRouter.createCaller(ctx);
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

        await authorizedBlobCaller.createWeaveVMReferences({
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

        await authorizedBlobCaller.createWeaveVMReferences({
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
          authorizedBlobCaller.createWeaveVMReferences({
            blobHashes: [],
          })
        ).resolves.toBeUndefined();
      });

      testValidError(
        "should fail when one or more provided blobs do not exist",
        async () => {
          await authorizedBlobCaller.createWeaveVMReferences({
            blobHashes: ["nonExistingBlobHash"],
          });
        },
        TRPCError,
        {
          checkCause: true,
        }
      );

      unauthorizedRPCCallTest(() =>
        blobCaller.createWeaveVMReferences({
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
      blobCaller.getAll(paginationInput).then(({ blobs, totalBlobs }) => ({
        items: blobs,
        totalItems: totalBlobs,
      }))
    );

    runFiltersTestsSuite("blob", (baseGetAllInput) =>
      blobCaller.getAll(baseGetAllInput).then(({ blobs }) => blobs)
    );

    runExpandsTestsSuite("blob", ["block", "transaction"], (input) =>
      blobCaller.getAll(input).then(({ blobs }) => blobs)
    );
  });

  describe("getByBlobId", () => {
    it("should get a blob by versioned hash", async () => {
      const input: GetByIdInput = {
        id: "blobHash004",
      };

      const result = await blobCaller.getByBlobId(input);

      expect(result).toMatchSnapshot();
    });

    it("should get a blob by kzg commitment", async () => {
      const input: GetByIdInput = {
        id: "commitment004",
      };

      const result = await blobCaller.getByBlobId(input);

      expect(result).toMatchSnapshot();
    });

    it("should fail when trying to get a blob by a non-existent hash", async () => {
      await expect(
        blobCaller.getByBlobId({
          id: "nonExistingHash",
        })
      ).rejects.toMatchSnapshot();
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
      const { totalBlobs } = await blobCaller.getCount({});

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

      const { totalBlobs } = await blobCaller.getCount(queryParamFilters);

      expect(totalBlobs).toBe(expectedTotalBlobs);
    });
  });

  describe("getBlobDataByBlobId", () => {
    let blobDataAuthorizedContext: Awaited<
      ReturnType<typeof createTestContext>
    >;
    let authorizedBlobDataCaller: ReturnType<typeof blobRouter.createCaller>;
    const versionedHash =
      "0x01f433be851da7e34bf14bf4f21b4c7db4b38afee7ec74d3c576fdce9f8f6734";
    const unprefixedBlobData = fixtures.blobDatas
      .find((d) => d.id === versionedHash)
      ?.data.toString("hex");
    const expectedBlobData = `0x${unprefixedBlobData}`;

    beforeEach(async () => {
      vi.resetModules();
      vi.unmock("@blobscan/env");

      blobDataAuthorizedContext = await createTestContext({
        apiClient: { type: "blob-data" },
      });
      authorizedBlobDataCaller = blobRouter.createCaller(
        blobDataAuthorizedContext
      );
    });

    describe("when authorized", () => {
      it("should fetch data by versioned hash", async () => {
        const result = await authorizedBlobDataCaller.getBlobDataByBlobId({
          id: versionedHash,
        });

        expect(result).toEqual(expectedBlobData);
      });

      it("should fetch data by kzg commitment", async () => {
        const commitment =
          "0x8c5b4383c1db58dc3f615ee8a1fdeb2a1ad19d1f26d72119c23b36b5df30ea4be9d55ccb9254f7a7993d23a78bd858ce";

        const result = await authorizedBlobDataCaller.getBlobDataByBlobId({
          id: commitment,
        });

        expect(result).toEqual(expectedBlobData);
      });

      describe("when fetching blob data stored in different formats", () => {
        const blobHash =
          "0x01000000000000000000000000000000000000000000000000000000000000b1";
        const blobBinFileName = `${blobHash.slice(2)}.bin`;
        const blobTxtFileName = `${blobHash.slice(2)}.txt`;
        const blobData = "0x0e2e5a3a2011ad49f5055eb3227d66d5";
        function createBlobDataStorageRef(
          blobStorage: BlobStorage,
          extension: "bin" | "txt"
        ): BlobDataStorageReference {
          return {
            blobHash: blobHash,
            blobStorage: blobStorage,
            dataReference: `1/01/00/00/01000000000000000000000000000000000000000000000000000000000000b1.${extension}`,
          };
        }

        beforeEach(async () => {
          fs.writeFileSync(
            blobBinFileName,
            hexToBytes("0x0e2e5a3a2011ad49f5055eb3227d66d5")
          );
          fs.writeFileSync(blobTxtFileName, blobData, {
            encoding: "utf-8",
          });

          await prisma.blobDataStorageReference.create;

          return async () => {
            await Promise.all([
              fs.promises.unlink(blobBinFileName),
              fs.promises.unlink(blobTxtFileName),
            ]);
          };
        });

        beforeEach(async () => {
          await prisma.blobDataStorageReference.deleteMany({
            where: {
              blobHash: blobHash,
            },
          });
        });

        it("should fetch data stored as a binary", async () => {
          const gcsBinRef = createBlobDataStorageRef("GOOGLE", "bin");
          const gcsUrl = buildBlobDataUrl(
            gcsBinRef.blobStorage,
            gcsBinRef.dataReference
          );
          const response = await fetch(gcsUrl);

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const blobBytes = await response.arrayBuffer();
          const expectedBlobData = bytesToHex(blobBytes);

          await prisma.blobDataStorageReference.create({
            data: gcsBinRef,
          });

          const result = await authorizedBlobDataCaller.getBlobDataByBlobId({
            id: gcsBinRef.blobHash,
          });

          expect(result).toEqual(expectedBlobData);
        });

        it("should fetch data stored as text", async () => {
          const gcsTxtRef = createBlobDataStorageRef("GOOGLE", "txt");

          const gcsUrl = buildBlobDataUrl(
            gcsTxtRef.blobStorage,
            gcsTxtRef.dataReference
          );
          const response = await fetch(gcsUrl);

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const expectedBlobData = await response.text();

          await prisma.blobDataStorageReference.create({
            data: gcsTxtRef,
          });

          const result = await authorizedBlobDataCaller.getBlobDataByBlobId({
            id: gcsTxtRef.blobHash,
          });

          expect(result).toEqual(expectedBlobData);
        });
      });

      it("should fetch data stored in Postgres", async () => {
        const blobHash =
          "0x01000000000000000000000000000000000000000000000000000000000000b3";
        const expectedBlobData = await prisma.blobData
          .findUnique({
            where: {
              id: blobHash,
            },
          })
          .then((r) => (r?.data ? bytesToHex(r.data) : undefined));

        const result = await authorizedBlobDataCaller.getBlobDataByBlobId({
          id: blobHash,
        });

        expect(result).toEqual(expectedBlobData);
      });

      testValidError(
        "should fail when the blob data wasn't retrieved from any of the storages",
        async () => {
          await prisma.blobDataStorageReference.update({
            data: {
              dataReference: "123131231231231231231",
            },
            where: {
              blobHash_blobStorage: {
                blobHash: versionedHash,
                blobStorage: "POSTGRES",
              },
            },
          });
          await prisma.blobDataStorageReference.create({
            data: {
              blobHash: versionedHash,
              blobStorage: "GOOGLE",
              dataReference: "123131231231231231231",
            },
          });

          await authorizedBlobDataCaller.getBlobDataByBlobId({
            id: versionedHash,
          });
        },
        TRPCError,
        {
          checkCause: true,
        }
      );

      testValidError(
        "should fail when no blob data is found for the provided id",
        async () => {
          blobDataAuthorizedContext = await createTestContext({
            apiClient: { type: "blob-data" },
          });
          authorizedBlobDataCaller = blobRouter.createCaller(
            blobDataAuthorizedContext
          );

          await authorizedBlobDataCaller.getBlobDataByBlobId({
            id: "0x0130c6c0b2ed8e4951560d6c996ccab18486de35aee7a9064c957605c80d90d1",
          });
        },
        TRPCError
      );

      blobIdSchemaTestsSuite(async (invalidBlobId) => {
        await authorizedBlobDataCaller.getBlobDataByBlobId({
          id: invalidBlobId,
        });
      });
    });

    it("should fail when calling procedure without auth", async () => {
      vi.mock("@blobscan/env", async (original) => {
        const mod = (await original()) as { env: Record<string, unknown> };
        return {
          ...mod,
          env: {
            ...mod.env,
            BLOB_DATA_API_KEY: "key_secret",
            BLOB_DATA_API_ENABLED: true,
          },
        };
      });

      const ctx = await createTestContext();
      const unauthorizedBlobDataCaller = blobRouter.createCaller(ctx);

      await expect(
        unauthorizedBlobDataCaller.getBlobDataByBlobId({
          id: versionedHash,
        })
      ).rejects.toThrow(new TRPCError({ code: "UNAUTHORIZED" }));
    });
  });
});
