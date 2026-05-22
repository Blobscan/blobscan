import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { BlobStorage } from "@blobscan/db/prisma/enums";
import { testValidError } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext, unauthorizedRPCCallTest } from "../helpers";
import { createBlobCaller } from "./caller";
import type { BlobCaller } from "./caller";

describe("createIpfsReferences", () => {
  let authorizedBlobCaller: BlobCaller;
  let unauthorizedBlobCaller: BlobCaller;
  let ctx: TRPCContext;

  const references = [
    {
      versionedHash:
        "0x01000000000000000000000000000000000000000000000000000000000000b1",
      dataCid: "bafkreidszvxiiiwea75w2cmgsdyrgc355v7mf57v4hjqxwovehybknrxsm",
      metaCid: "bafkreidvq553ihjzhnp3qrk44yhm3do2aaoqmmles2yu36t7rflfn3wkji",
    },
    {
      versionedHash:
        "0x01000000000000000000000000000000000000000000000000000000000000b2",
      dataCid: "bafkreiderks4k6p3gdzyv52e3f6w5scay6ure55etgqnpaht44yu5sqjbm",
      metaCid: "bafkreie7j63i6pq5vsbcal42uwa44c57d53f34hjvq6iyv7cb5ufvovy5u",
    },
    {
      versionedHash:
        "0x01000000000000000000000000000000000000000000000000000000000000b3",
      dataCid: "bafkreidszvxiiiwea75w2cmgsdyrgc355v7mf57v4hjqxwovehybknrxsm",
      metaCid: "bafkreidvq553ihjzhnp3qrk44yhm3do2aaoqmmles2yu36t7rflfn3wkji",
    },
  ];

  const where = {
    AND: [
      { blobHash: { in: references.map((r) => r.versionedHash) } },
      { blobStorage: BlobStorage.IPFS },
    ],
  };

  beforeAll(async () => {
    const authorizedCtx = await createTestContext({ apiClient: "ipfs" });
    ctx = await createTestContext();

    authorizedBlobCaller = createBlobCaller(authorizedCtx);
    unauthorizedBlobCaller = createBlobCaller(ctx);
  });

  it("should insert references correctly", async () => {
    const before = await ctx.prisma.blobDataStorageReference.findMany({ where });
    expect(before, "no IPFS references should exist initially").toEqual([]);

    await authorizedBlobCaller.createIpfsReferences({ references });

    const after = await ctx.prisma.blobDataStorageReference
      .findMany({ where })
      .then((refs) =>
        refs
          .map(({ blobHash, dataReference, metaReference }) => ({
            blobHash,
            dataReference,
            metaReference,
          }))
          .sort((a, b) => a.blobHash.localeCompare(b.blobHash))
      );

    expect(after).toEqual(
      references
        .map(({ versionedHash, dataCid, metaCid }) => ({
          blobHash: versionedHash,
          dataReference: dataCid,
          metaReference: metaCid,
        }))
        .sort((a, b) => a.blobHash.localeCompare(b.blobHash))
    );
  });

  it("should skip already existing references", async () => {
    await ctx.prisma.blobDataStorageReference.createMany({
      data: references.map(({ versionedHash, dataCid }) => ({
        blobHash: versionedHash,
        blobStorage: BlobStorage.IPFS,
        dataReference: dataCid,
      })),
    });

    await authorizedBlobCaller.createIpfsReferences({ references });

    const after = await ctx.prisma.blobDataStorageReference.findMany({ where });
    expect(after).toHaveLength(references.length);
  });

  it("should handle an empty references array", async () => {
    await expect(
      authorizedBlobCaller.createIpfsReferences({ references: [] })
    ).resolves.toBeUndefined();
  });

  testValidError(
    "should fail when one or more blobs do not exist",
    async () => {
      await authorizedBlobCaller.createIpfsReferences({
        references: [
          {
            versionedHash:
              "0x01ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            dataCid:
              "bafkreidszvxiiiwea75w2cmgsdyrgc355v7mf57v4hjqxwovehybknrxsm",
            metaCid:
              "bafkreidvq553ihjzhnp3qrk44yhm3do2aaoqmmles2yu36t7rflfn3wkji",
          },
        ],
      });
    },
    TRPCError,
    { checkCause: true }
  );

  unauthorizedRPCCallTest(() =>
    unauthorizedBlobCaller.createIpfsReferences({ references })
  );
});
