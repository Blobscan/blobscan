import { TRPCError } from "@trpc/server";

import type { BlobReference } from "@blobscan/blob-storage-manager";

import { withExpands } from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { retrieveBlobData } from "../../utils";
import { createBlobSelect } from "./common/selects";
import { serializeBlob } from "./common/serializers";
import {
  getByBlobIdInputSchema,
  getByBlobIdOutputSchema,
} from "./getByBlobId.schema";

export const getByBlobId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs/{id}",
      tags: ["blobs"],
      summary:
        "retrieves blob details for given versioned hash or kzg commitment.",
    },
  })
  .input(getByBlobIdInputSchema)
  .output(getByBlobIdOutputSchema)
  .use(withExpands)
  .query(async ({ ctx: { prisma, blobStorageManager, expands }, input }) => {
    const { id } = input;

    const queriedBlob = await prisma.blob.findFirst({
      select: createBlobSelect(expands),
      where: {
        OR: [{ versionedHash: id }, { commitment: id }],
      },
    });

    if (!queriedBlob) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob with versioned hash or kzg commitment '${id}'.`,
      });
    }

    const { data: blobData } = await retrieveBlobData(
      blobStorageManager,
      queriedBlob.dataStorageReferences
    );

    return serializeBlob({
      ...queriedBlob,
      data: blobData,
    });
  });
