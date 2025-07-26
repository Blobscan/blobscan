import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import type { CompletePrismaTransaction } from "./helpers";
import {
  createTransactionSelect,
  responseTransactionSchema,
  toResponseTransaction,
} from "./helpers";

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
  .query(async ({ ctx: { expands, prisma }, input: { hash } }) => {
    const [prismaTx, ethUsdPrice] = await Promise.all([
      prisma.transaction.findUnique({
        select: createTransactionSelect(expands),
        where: { hash },
      }) as unknown as Promise<CompletePrismaTransaction | null>,
      prisma.transaction.findEthUsdPrice(hash),
    ]);

    if (!prismaTx) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No transaction with hash '${hash}'.`,
      });
    }

    prismaTx.ethUsdPrice = ethUsdPrice;

    return toResponseTransaction(prismaTx);
  });
