import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { findResponseTransaction, responseTransactionSchema } from "./helpers";

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
  .query(async ({ ctx: { expands, prisma }, input: { hash } }) => {
    const tx = await findResponseTransaction(prisma, expands, hash);

    if (!tx) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No transaction with hash '${hash}'.`,
      });
    }

    return tx;
  });
