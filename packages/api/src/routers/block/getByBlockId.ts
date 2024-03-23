import { TRPCError } from "@trpc/server";

import type { Prisma } from "@blobscan/db";

import { withExpands } from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import {
  calculateDerivedTxBlobGasFields,
  isEmptyObject,
  retrieveBlobData,
} from "../../utils";
import { createBlockSelect, serializeBlock } from "./common";
import type { QueriedBlock } from "./common";
import {
  getByBlockIdOutputSchema,
  getByBlockIdInputSchema,
} from "./getByBlockId.schema";

export const getByBlockId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/blocks/{id}`,
      tags: ["blocks"],
      summary: "retrieves block details for given block number or hash.",
    },
  })
  .input(getByBlockIdInputSchema)
  .output(getByBlockIdOutputSchema)
  .use(withExpands)
  .query(
    async ({
      ctx: { blobStorageManager, prisma, expands },
      input: { id, reorg },
    }) => {
      const idWhereFilters: Prisma.BlockWhereInput[] =
        typeof id === "number" ? [{ number: id }] : [{ hash: id }];

      const queriedBlock = await prisma.block.findFirst({
        select: createBlockSelect(expands),
        where: {
          OR: idWhereFilters,
          transactionForks: {
            ...(reorg ? { some: {} } : { none: {} }),
          },
        },
      });

      if (!queriedBlock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No block with id '${id}'.`,
        });
      }

      const block: QueriedBlock = queriedBlock;

      const isExpandedTransactionSet = !isEmptyObject(
        expands.expandedTransactionSelect
      );
      const isExpandedBlobSet = !isEmptyObject(expands.expandedBlobSelect);

      if (isExpandedTransactionSet) {
        block.transactions = block.transactions.map((tx) => {
          const derivedFields = calculateDerivedTxBlobGasFields({
            blobGasPrice: block.blobGasPrice,
            maxFeePerBlobGas: tx.maxFeePerBlobGas,
            txBlobsLength: tx.blobs.length,
          });

          return {
            ...tx,
            ...derivedFields,
          };
        });
      }

      if (isExpandedBlobSet) {
        await Promise.all([
          block.transactions.flatMap((tx) =>
            tx.blobs.map(async ({ blob }) => {
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
          ),
        ]);
      }

      return serializeBlock(queriedBlock);
    }
  );
