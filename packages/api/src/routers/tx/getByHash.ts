import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { isEmptyObject, retrieveBlobData } from "../../utils";
import {
  addDerivedFieldsToTransaction,
  createTransactionSelect,
  serializeTransaction,
  serializedTransactionSchema,
} from "./common";
import type { BaseTransaction } from "./common";

const inputSchema = z
  .object({
    hash: z.string(),
  })
  .merge(createExpandsSchema(["block", "blob"]));

const outputSchema = serializedTransactionSchema;
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
      const queriedTx: BaseTransaction | null =
        await prisma.transaction.findUnique({
          select: createTransactionSelect(expands),
          where: { hash },
        });

      if (!queriedTx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No transaction with hash '${hash}'.`,
        });
      }

      const isExpandedBlobSet = !isEmptyObject(expands.expandedBlobSelect);

      if (isExpandedBlobSet) {
        await Promise.all(
          queriedTx.blobs.map(async ({ blob }) => {
            if (
              blob.dataStorageReferences &&
              blob.dataStorageReferences.length
            ) {
              const { data } = await retrieveBlobData(
                blobStorageManager,
                blob.dataStorageReferences
              );

              blob.data = data;
            }
          })
        );
      }

      return serializeTransaction(addDerivedFieldsToTransaction(queriedTx));
    }
  );
