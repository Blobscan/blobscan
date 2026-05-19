import { TRPCError } from "@trpc/server";
import { CID } from "multiformats/cid";

import { BlobStorage } from "@blobscan/db/prisma/enums";
import { z } from "@blobscan/zod";

import { createAuthedProcedure } from "../../procedures";

// Postgres caps bind parameters at 65535; keep batches well below that so the
// `IN` lookup and `createMany` stay within a single statement regardless of
// how large a batch blobscan-ipld posts.
const DB_BATCH_SIZE = 1_000;

const cidSchema = z.string().refine(
  (value) => {
    try {
      CID.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid IPFS CID" }
);

const versionedHashSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, "Invalid versioned hash");

const inputSchema = z.object({
  references: z.array(
    z.object({
      versionedHash: versionedHashSchema,
      dataCid: cidSchema,
      metaCid: cidSchema,
    })
  ),
});

const outputSchema = z.void();

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

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

    // Run the existence check and the inserts in a single transaction so a
    // blob deleted between the two steps can't cause a partially-applied
    // batch: the foreign-key violation rolls the whole operation back.
    await prisma.$transaction(async (tx) => {
      const dbVersionedHashes = new Set<string>();
      for (const batch of chunk(versionedHashes, DB_BATCH_SIZE)) {
        const blobs = await tx.blob.findMany({
          select: { versionedHash: true },
          where: { versionedHash: { in: batch } },
        });
        for (const { versionedHash } of blobs) {
          dbVersionedHashes.add(versionedHash);
        }
      }

      const missingHashes = versionedHashes
        .filter((hash) => !dbVersionedHashes.has(hash))
        .map((hash) => `"${hash}"`);

      if (missingHashes.length > 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Couldn't find the following blobs: ${missingHashes.join(
            ", "
          )}`,
        });
      }

      for (const batch of chunk(references, DB_BATCH_SIZE)) {
        await tx.blobDataStorageReference.createMany({
          data: batch.map(({ versionedHash, dataCid, metaCid }) => ({
            blobHash: versionedHash,
            dataReference: dataCid,
            metaReference: metaCid,
            blobStorage: BlobStorage.IPFS,
          })),
          skipDuplicates: true,
        });
      }
    });
  });
