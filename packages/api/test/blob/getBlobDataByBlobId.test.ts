import { TRPCError } from "@trpc/server";
import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlobDataStorageReference } from "@blobscan/db";
import type { BlobStorage } from "@blobscan/db/prisma/enums";
import { env, fixtures, testValidError } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createBlobRouter } from "../../src/routers/blob";
import { bytesToHex, hexToBytes } from "../../src/utils";
import { createTestContext } from "../helpers";
import { blobIdSchemaTestsSuite } from "../test-suites/schemas";

function buildGoogleBlobDataUrl(dataReference: string) {
  return `${env.GOOGLE_STORAGE_API_ENDPOINT}/storage/v1/b/${
    env.GOOGLE_STORAGE_BUCKET_NAME
  }/o/${encodeURIComponent(dataReference)}?alt=media`;
}

describe("getBlobDataByBlobId", () => {
  const blobRouter = createBlobRouter();
  let blobDataRouter: ReturnType<typeof createBlobRouter>;
  let authorizedCtx: TRPCContext;
  let authorizedBlobDataCaller: ReturnType<typeof blobRouter.createCaller>;

  const versionedHash =
    "0x01f433be851da7e34bf14bf4f21b4c7db4b38afee7ec74d3c576fdce9f8f6734";
  const unprefixedBlobData = fixtures.blobDatas
    .find((d) => d.id === versionedHash)
    ?.data.toString("hex");
  const expectedBlobData = `0x${unprefixedBlobData}`;

  beforeEach(async () => {
    vi.resetModules();
    vi.unmock("@blobscan/test");

    blobDataRouter = createBlobRouter({
      blobDataProcedure: { enabled: true, protected: true },
    });
    authorizedCtx = await createTestContext({
      apiClient: "blob-data",
    });
    authorizedBlobDataCaller = createBlobRouter({
      blobDataProcedure: { enabled: true, protected: true },
    }).createCaller(authorizedCtx);
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

        await authorizedCtx.prisma.blobDataStorageReference.create;

        return async () => {
          await Promise.all([
            fs.promises.unlink(blobBinFileName),
            fs.promises.unlink(blobTxtFileName),
          ]);
        };
      });

      beforeEach(async () => {
        await authorizedCtx.prisma.blobDataStorageReference.deleteMany({
          where: {
            blobHash: blobHash,
          },
        });
      });

      it("should fetch data stored as a binary", async () => {
        const gcsBinRef = createBlobDataStorageRef("GOOGLE", "bin");
        const gcsUrl = buildGoogleBlobDataUrl(gcsBinRef.dataReference);
        const response = await fetch(gcsUrl);

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const blobBytes = await response.arrayBuffer();
        const expectedBlobData = bytesToHex(blobBytes);

        await authorizedCtx.prisma.blobDataStorageReference.create({
          data: gcsBinRef,
        });

        const result = await authorizedBlobDataCaller.getBlobDataByBlobId({
          id: gcsBinRef.blobHash,
        });

        expect(result).toEqual(expectedBlobData);
      });

      it("should fetch data stored as text", async () => {
        const gcsTxtRef = createBlobDataStorageRef("GOOGLE", "txt");

        const gcsUrl = buildGoogleBlobDataUrl(gcsTxtRef.dataReference);
        const response = await fetch(gcsUrl);

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const expectedBlobData = await response.text();

        await authorizedCtx.prisma.blobDataStorageReference.create({
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
      const expectedBlobData = await authorizedCtx.prisma.blobData
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
        await authorizedCtx.prisma.blobDataStorageReference.update({
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
        await authorizedCtx.prisma.blobDataStorageReference.create({
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
        // blobDataAuthorizedContext = await createTestContext({
        //   apiClient: "blob-data",
        // });
        // authorizedBlobDataCaller = blobRouter.createCaller(
        //   blobDataAuthorizedContext
        // );

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
    vi.mock("@blobscan/test", async (original) => {
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
    const unauthorizedBlobDataCaller = blobDataRouter.createCaller(ctx);

    await expect(
      unauthorizedBlobDataCaller.getBlobDataByBlobId({
        id: versionedHash,
      })
    ).rejects.toThrow(new TRPCError({ code: "UNAUTHORIZED" }));
  });
});
