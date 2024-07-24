import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import {
  withFilters,
  withTypeFilterSchema,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { calculateDerivedTxBlobGasFields, retrieveBlobData } from "../../utils";
import {
  createBlockSelect,
  serializeBlock,
  serializedBlockSchema,
} from "./common";
import type { QueriedBlock } from "./common";

const blockIdSchema = z
  .string()
  .refine(
    (id) => {
      const isHash = id.startsWith("0x") && id.length === 66;
      const s_ = Number(id);
      const isNumber = !isNaN(s_) && s_ > 0;

      return isHash || isNumber;
    },
    {
      message: "Invalid block id",
    }
  )
  .transform((id) => {
    if (id.startsWith("0x")) {
      return id;
    }

    return Number(id);
  });

const inputSchema = z
  .object({
    id: blockIdSchema,
  })
  .merge(withTypeFilterSchema)
  .merge(createExpandsSchema(["transaction", "blob", "blob_data"]));

const outputSchema = serializedBlockSchema;

export const getByBlockId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/blocks/{id}`,
      tags: ["blocks"],
      summary: "retrieves block details for given block number or hash.",
    },
  })
  .input(inputSchema)
  .use(withExpands)
  .use(withFilters)
  .output(outputSchema)
  .query(
    async ({
      ctx: { blobStorageManager, prisma, expands, filters },
      input: { id },
    }) => {
      const isNumber = typeof id === "number";

      const queriedBlock = await prisma.block.findFirst({
        select: createBlockSelect(expands),
        where: {
          [isNumber ? "number" : "hash"]: id,
          // Hash is unique, so we don't need to filter by transaction forks if we're querying by it
          transactionForks: isNumber ? filters.blockType : undefined,
        },
      });

      if (!queriedBlock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No block with id '${id}'.`,
        });
      }

      const block: QueriedBlock = queriedBlock;

      if (expands.transaction) {
        block.transactions = block.transactions.map((tx) => {
          const derivedFields =
            tx.maxFeePerBlobGas && tx.blobAsCalldataGasUsed && tx.gasPrice
              ? calculateDerivedTxBlobGasFields({
                  blobAsCalldataGasUsed: tx.blobAsCalldataGasUsed,
                  gasPrice: tx.gasPrice,
                  blobGasPrice: block.blobGasPrice,
                  maxFeePerBlobGas: tx.maxFeePerBlobGas,
                  txBlobsLength: tx.blobs.length,
                })
              : {};

          return {
            ...tx,
            ...derivedFields,
          };
        });
      }

      if (expands.blobData) {
        const txsBlobs = block.transactions.flatMap((tx) => tx.blobs);

        await Promise.all(
          txsBlobs.map(async ({ blob }) => {
            if (blob.dataStorageReferences?.length) {
              const data = await retrieveBlobData(blobStorageManager, blob);

              blob.data = data;
            }
          })
        );
      }

      return serializeBlock(block);
    }
  );
