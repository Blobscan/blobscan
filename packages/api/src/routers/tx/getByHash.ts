import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { calculateTxFeeFields, retrieveBlobData } from "../../utils";
import { createTransactionSelect, serializedTransactionSchema } from "./common";
import type { Transaction } from "./common/serializers";

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
      const tx = (await prisma.transaction.findUnique({
        select: createTransactionSelect(expands),
        where: { hash },
      })) as unknown as Transaction;

      if (!tx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No transaction with hash '${hash}'.`,
        });
      }

      if (expands.blobData) {
        await Promise.all(
          tx.blobs.map(async ({ blob }) => {
            if (blob?.dataStorageReferences?.length) {
              const data = await retrieveBlobData(blobStorageManager, blob);

              blob.data = data;
            }
          })
        );
      }

      const { blobAsCalldataGasFee, blobGasBaseFee, blobGasMaxFee } =
        calculateTxFeeFields({
          blobAsCalldataGasUsed: tx.blobAsCalldataGasUsed,
          blobGasUsed: tx.blobGasUsed,
          gasPrice: tx.gasPrice,
          maxFeePerBlobGas: tx.maxFeePerBlobGas,
          blobGasPrice: tx.block.blobGasPrice,
        });

      tx.blobAsCalldataGasFee = blobAsCalldataGasFee;
      tx.blobGasBaseFee = blobGasBaseFee;
      tx.blobGasMaxFee = blobGasMaxFee;

      return tx;
    }
  );
