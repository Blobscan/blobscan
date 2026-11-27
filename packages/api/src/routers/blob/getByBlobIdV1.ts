import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { findResponseBlobV1, responseBlobV1Schema } from "./helpers";

const inputSchema = z.object({
  id: z.string(),
});

const outputSchema = responseBlobV1Schema.transform(normalize);

export const getByBlobIdV1 = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/blobs/{id}",
      tags: ["blobs"],
      summary:
        "retrieves blob details for given versioned hash or kzg commitment, with the number of its transactions. List them with /v1/blobs?blob=<versioned hash>.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(async ({ ctx: { prisma }, input: { id } }) => {
    const blob = await findResponseBlobV1(prisma, id);

    if (!blob) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob with versioned hash or kzg commitment '${id}'.`,
      });
    }

    return blob;
  });
