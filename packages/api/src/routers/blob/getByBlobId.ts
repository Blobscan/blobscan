import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { retrieveBlobData } from "../../utils";
import { createBlobSelect } from "./common/selects";
import { serializeBlob, serializedBlobSchema } from "./common/serializers";

const inputSchema = z
  .object({
    id: z.string(),
  })
  .merge(createExpandsSchema(["transaction", "block"]));

const outputSchema = serializedBlobSchema;

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
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
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
