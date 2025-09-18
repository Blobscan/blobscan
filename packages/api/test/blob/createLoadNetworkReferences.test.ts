import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { BlobStorage } from "@blobscan/db/prisma/enums";
import { testValidError } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext, unauthorizedRPCCallTest } from "../helpers";
import { createBlobCaller } from "./caller";
import type { BlobCaller } from "./caller";

describe("createLoadNetworkReferences", () => {
  let authorizedBlobCaller: BlobCaller;
  let unauthorizedBlobCaller: BlobCaller;
  let unauthorizedCtx: TRPCContext;
  let authorizedContext: TRPCContext;

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

  beforeAll(async () => {
    authorizedContext = await createTestContext({
      apiClient: "load-network",
    });
    unauthorizedCtx = await createTestContext();

    authorizedBlobCaller = createBlobCaller(authorizedContext);
    unauthorizedBlobCaller = createBlobCaller(unauthorizedCtx);
  });

  describe("when authorized", () => {
    it("should insert references correctly", async () => {
      const blobReferencesBefore =
        await unauthorizedCtx.prisma.blobDataStorageReference.findMany({
          where,
        });

      expect(
        blobReferencesBefore,
        "There should be no blob weavevm references initially"
      ).toEqual([]);

      await authorizedBlobCaller.createWeaveVMReferences({
        blobHashes,
      });

      const blobReferencesAfter =
        await unauthorizedCtx.prisma.blobDataStorageReference
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
      await unauthorizedCtx.prisma.blobDataStorageReference.createMany({
        data: blobHashes.map((blobHash) => ({
          blobHash,
          blobStorage: BlobStorage.WEAVEVM,
          dataReference: blobHash,
        })),
      });

      await authorizedBlobCaller.createWeaveVMReferences({
        blobHashes,
      });

      const blobReferencesAfter =
        await unauthorizedCtx.prisma.blobDataStorageReference
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
      unauthorizedBlobCaller.createWeaveVMReferences({
        blobHashes,
      })
    );
  });
});
