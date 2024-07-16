import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import {
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import {
  withPaginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { calculateDerivedTxBlobGasFields } from "../../utils";
import {
  createBlockSelect,
  serializeBlock,
  serializedBlockSchema,
} from "./common";
import type { QueriedBlock } from "./common";

const inputSchema = withAllFiltersSchema
  .merge(createExpandsSchema(["transaction", "blob"]))
  .merge(withPaginationSchema)
  .optional();

const outputSchema = z.object({
  blocks: serializedBlockSchema.array(),
  totalBlocks: z.number(),
});

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blocks",
      tags: ["blocks"],
      summary: "retrieves all blocks.",
    },
  })
  .input(inputSchema)
  .use(withFilters)
  .use(withExpands)
  .use(withPagination)
  .output(outputSchema)
  .query(async ({ ctx: { expands, filters, pagination, prisma } }) => {
    const [queriedBlocks, totalBlocks] = await Promise.all([
      prisma.block.findMany({
        select: createBlockSelect(expands),
        where: {
          number: filters.blockNumber,
          timestamp: filters.blockTimestamp,
          slot: filters.blockSlot,

          transactionForks: filters.blockType,
          transactions:
            filters.transactionRollup !== undefined ||
            filters.transactionAddresses
              ? {
                  some: {
                    rollup: filters.transactionRollup,
                    OR: filters.transactionAddresses,
                  },
                }
              : undefined,
        },
        orderBy: { number: filters.sort },
        ...pagination,
      }),
      prisma.blockOverallStats
        .findFirst({
          select: {
            totalBlocks: true,
          },
        })
        .then((stats) => stats?.totalBlocks ?? 0),
    ]);

    let blocks: QueriedBlock[] = queriedBlocks;

    if (expands.transaction) {
      blocks = blocks.map((block) => ({
        ...block,
        transactions: block.transactions.map((tx) => {
          const derivedTxFields =
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
            ...derivedTxFields,
          };
        }),
      }));
    }

    /**
     * When rollup filter is set we need to filter out the transactions don't
     * match manually as the query returns all the transactions in the block
     */
    if (filters.transactionRollup !== undefined) {
      blocks = queriedBlocks.map((block) => ({
        ...block,
        transactions: block.transactions.filter(
          (tx) => tx.rollup === filters.transactionRollup
        ),
      }));
    }

    return {
      blocks: blocks.map(serializeBlock),
      totalBlocks,
    };
  });
