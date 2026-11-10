import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { getResponseTransaction, responseTransactionSchema } from "./helpers";

const inputSchema = z
  .object({
    hash: z.string(),
  })
  .merge(createExpandsSchema(["block", "blob"]));

const outputSchema = responseTransactionSchema.transform(normalize);

export const getByHash = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/transactions/{hash}",
      tags: ["transactions"],
      summary: "retrieves transaction details for given transaction hash.",
    },
  })
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(({ ctx: { expands, prisma }, input: { hash } }) =>
    getResponseTransaction(prisma, expands, hash)
  );
