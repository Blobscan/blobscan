import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import {
  blobIdSchema,
  blobVersionedHashSchema,
  buildVersionedHash,
  hexSchema,
} from "../../utils";

const inputSchema = z.object({
  id: blobIdSchema,
});

const outputSchema = z.object({
  data: hexSchema,
});

export const getBlobDataByBlobId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs/{id}/data",
      tags: ["blobs"],
      summary: "Retrieves blob data for given blob id.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input: { id } }) => {
    let versionedHash: string;

    if (blobVersionedHashSchema.safeParse(id).success) {
      versionedHash = id;
    } else {
      versionedHash = buildVersionedHash(id);
    }

    const blobData = await prisma.blobData.findFirst({
      where: {
        id: versionedHash,
      },
    });

    if (!blobData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob data with versioned hash '${id}'.`,
      });
    }

    return {
      data: `0x${blobData?.data.toString("hex")}`,
    };
  });
