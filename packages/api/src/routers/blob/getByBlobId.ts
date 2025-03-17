import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { retrieveBlobData } from "../../utils";
import type { CompletePrismaBlob } from "./common";
import { createBlobSelect, serializedBlobSchema } from "./common";

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

    const blob = (await prisma.blob.findFirst({
      select: createBlobSelect(expands),
      where: {
        OR: [{ versionedHash: id }, { commitment: id }],
      },
    })) as unknown as CompletePrismaBlob | null;

    if (!blob) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob with versioned hash or kzg commitment '${id}'.`,
      });
    }

    blob.data = await retrieveBlobData(blobStorageManager, blob);

    return blob;
  });
