import { TRPCError } from "@trpc/server";

import { BlobStorage, prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { retrieveBlobData } from "../../utils";

export const getBlobData = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs/{id}/data",
      tags: ["blobs"],
      summary:
        "retrieves blob data for given versioned hash or kzg commitment.",
    },
  })
  .input(
    z.object({
      id: z.string(),
    })
  )
  .output(
    z.union([
      z.object({
        data: z.string(),
      }),
      z.object({
        redirectUri: z.string(),
      }),
    ])
  )
  .query(async ({ ctx, input }) => {
    const blob = await prisma.blob.findFirst({
      select: {
        versionedHash: true,
        dataStorageReferences: true,
      },
      where: {
        OR: [
          {
            versionedHash: input.id,
          },
          {
            commitment: input.id,
          },
        ],
      },
    });

    if (!blob) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob with versioned hash or kzg commitment '${input.id}'.`,
      });
    }

    for (const reference of blob.dataStorageReferences) {
      if (reference.blobStorage !== BlobStorage.GOOGLE) {
        continue;
      }

      const storage = ctx.blobStorageManager.getStorage(BlobStorage.GOOGLE);

      if (storage === undefined) {
        break;
      }

      const redirectUri = storage.getBlobUri(reference.dataReference);

      if (redirectUri === undefined) {
        break;
      }

      return {
        redirectUri,
      };
    }

    return {
      data: await retrieveBlobData(ctx.blobStorageManager, blob),
    };
  });
