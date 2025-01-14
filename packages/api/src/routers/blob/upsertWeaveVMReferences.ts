import { TRPCError } from "@trpc/server";

import type { BlobDataStorageReference } from "@blobscan/db";
import { BlobStorage } from "@blobscan/db/prisma/enums";
import { z } from "@blobscan/zod";

import { createAuthedProcedure } from "../../procedures";

const inputSchema = z.object({
  blobHashes: z.array(z.string()),
});

export const upsertWeaveVMReferences = createAuthedProcedure("weavevm")
  .meta({
    openapi: {
      method: "PUT",
      path: "/blobs/weavevm-references",
      tags: ["blobs"],
      summary: "upserts weaveVM blob references.",
    },
  })
  .input(inputSchema)
  .output(z.void())
  .mutation(async ({ ctx: { prisma }, input: { blobHashes } }) => {
    if (!blobHashes.length) {
      return;
    }

    const blobDataStorageReferences = blobHashes.map<BlobDataStorageReference>(
      (hash) => ({
        blobHash: hash,
        dataReference: hash,
        blobStorage: BlobStorage.WEAVEVM,
      })
    );

    const dbVersionedHashes = await prisma.blob
      .findMany({
        select: {
          versionedHash: true,
        },
        where: {
          versionedHash: {
            in: blobHashes,
          },
        },
      })
      .then((blobs) => blobs.map((b) => b.versionedHash));

    const missingHashes = blobHashes
      .filter((hash) => !dbVersionedHashes.includes(hash))
      .map((hash) => `"${hash}"`);

    if (missingHashes.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Couldn't found the following blobs: ${missingHashes.join(
          ", "
        )}`,
      });
    }

    await prisma.blobDataStorageReference.upsertMany(blobDataStorageReferences);
  });
