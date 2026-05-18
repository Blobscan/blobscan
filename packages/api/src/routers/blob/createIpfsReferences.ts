import { TRPCError } from "@trpc/server";

import { BlobStorage } from "@blobscan/db/prisma/enums";
import { z } from "@blobscan/zod";

import { createAuthedProcedure } from "../../procedures";

const inputSchema = z.object({
  references: z.array(
    z.object({
      versionedHash: z.string(),
      dataCid: z.string(),
      metaCid: z.string(),
    })
  ),
});

const outputSchema = z.void();

export const createIpfsReferences = createAuthedProcedure("ipfs")
  .meta({
    openapi: {
      method: "POST",
      path: "/blobs/ipfs-references",
      tags: ["blobs"],
      summary:
        "Creates IPFS CID references for a given set of blobs. Called by blobscan-ipld after storing blobs on IPFS.",
      protect: true,
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .mutation(async ({ ctx: { prisma }, input: { references } }) => {
    if (!references.length) {
      return;
    }

    const versionedHashes = references.map((r) => r.versionedHash);

    const dbVersionedHashes = await prisma.blob
      .findMany({
        select: { versionedHash: true },
        where: { versionedHash: { in: versionedHashes } },
      })
      .then((blobs) => blobs.map((b) => b.versionedHash));

    const missingHashes = versionedHashes
      .filter((hash) => !dbVersionedHashes.includes(hash))
      .map((hash) => `"${hash}"`);

    if (missingHashes.length > 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Couldn't find the following blobs: ${missingHashes.join(", ")}`,
      });
    }

    await prisma.blobDataStorageReference.createMany({
      data: references.map(({ versionedHash, dataCid }) => ({
        blobHash: versionedHash,
        dataReference: dataCid,
        blobStorage: BlobStorage.IPFS,
      })),
      skipDuplicates: true,
    });
  });
