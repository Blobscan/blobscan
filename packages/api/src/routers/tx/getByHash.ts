import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { calculateTxFeeFields, retrieveBlobData } from "../../utils";
import type { IncompletedTransaction } from "./common";
import {
  createTransactionSelect,
  serializeTransaction,
  serializedTransactionSchema,
} from "./common";

const inputSchema = z
  .object({
    hash: z.string(),
  })
  .merge(createExpandsSchema(["block", "blob", "blob_data"]));

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
      const dbTx = (await prisma.transaction.findUnique({
        select: createTransactionSelect(expands),
        where: { hash },
      })) as unknown as IncompletedTransaction;

      if (!dbTx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No transaction with hash '${hash}'.`,
        });
      }

      if (expands.blobData) {
        await Promise.all(
          dbTx.blobs.map(async ({ blob }) => {
            if (blob?.dataStorageReferences?.length) {
              const data = await retrieveBlobData(blobStorageManager, blob);

              blob.data = data;
            }
          })
        );
      }

      const txFeeFields = calculateTxFeeFields({
        blobAsCalldataGasUsed: dbTx.blobAsCalldataGasUsed,
        blobGasUsed: dbTx.blobGasUsed,
        gasPrice: dbTx.gasPrice,
        maxFeePerBlobGas: dbTx.maxFeePerBlobGas,
        blobGasPrice: dbTx.block.blobGasPrice,
      });
      const tx = {
        ...dbTx,
        ...txFeeFields,
      };

      return serializeTransaction(tx);
    }
  );
