import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { normalize, retrieveBlobData } from "../../utils";
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
  .merge(createExpandsSchema(["block", "blob", "blob_data"]));

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
  .query(
    async ({
      ctx: { blobStorageManager, expands, prisma },
      input: { hash },
    }) => {
      const prismaTx = (await prisma.transaction.findUnique({
        select: createTransactionSelect(expands),
        where: { hash },
      })) as unknown as CompletePrismaTransaction | null;

      if (!prismaTx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No transaction with hash '${hash}'.`,
        });
      }

      if (expands.blobData) {
        await Promise.all(
          prismaTx.blobs.map(async ({ blob }) => {
            if (blob?.dataStorageReferences?.length) {
              const data = await retrieveBlobData(blobStorageManager, blob);

              blob.data = data;
            }
          })
        );
      }

      return toResponseTransaction(prismaTx);
    }
  );
