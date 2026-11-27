import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { findResponseBlobV2, responseBlobV2Schema } from "./helpers";

const inputSchema = z.object({
  id: z.string(),
});

const outputSchema = responseBlobV2Schema.transform(normalize);

export const getByBlobIdV2 = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v2/blobs/{id}",
      tags: ["beta"],
      summary:
        "retrieves blob details for given versioned hash or kzg commitment, with the number of its transactions. List them with /v2/blobs/{id}/transactions.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(async ({ ctx: { prisma }, input: { id } }) => {
    const blob = await findResponseBlobV2(prisma, id);

    if (!blob) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob with versioned hash or kzg commitment '${id}'.`,
      });
    }

    return blob;
  });
