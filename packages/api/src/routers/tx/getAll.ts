import type { Prisma } from "@blobscan/db";
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
import { calculateTxFeeFields } from "../../utils";
import type { Transaction } from "./common";
import { createTransactionSelect, serializedTransactionSchema } from "./common";
import { countTxs } from "./getCount";

const inputSchema = withAllFiltersSchema
  .merge(createExpandsSchema(["block", "blob"]))
  .merge(withPaginationSchema)
  .optional();

const outputSchema = z.object({
  transactions: serializedTransactionSchema.array(),
  totalTransactions: z.number().optional(),
});

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/transactions",
      tags: ["transactions"],
      summary: "retrieves all blob transactions.",
    },
  })
  .input(inputSchema)
  .use(withFilters)
  .use(withExpands)
  .use(withPagination)
  .output(outputSchema)
  .query(async ({ ctx: { prisma, expands, filters, pagination, count } }) => {
    const {
      transactionFilters = {},
      blockFilters = {},
      blockType,
      sort,
    } = filters;

    let leadingOrderColumn: Prisma.TransactionOrderByWithRelationInput = {
      blockTimestamp: sort,
    };

    if (blockFilters.number) {
      leadingOrderColumn = {
        blockNumber: sort,
      };
    }

    const transactionsOp = prisma.transaction.findMany({
      select: createTransactionSelect(expands),
      where: {
        ...transactionFilters,
        blockNumber: blockFilters.number,
        blockTimestamp: blockFilters.timestamp,
        block: {
          slot: blockFilters.slot,
          transactionForks: blockType,
        },
      },
      orderBy: [
        leadingOrderColumn,
        {
          index: sort,
        },
      ],
      ...pagination,
    }) as unknown as Transaction[];

    const countOp = count
      ? countTxs(prisma, filters)
      : Promise.resolve(undefined);

    const [txs, txCountOrStats] = await Promise.all([transactionsOp, countOp]);

    txs.forEach((tx) => {
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
    });

    const output: z.input<typeof outputSchema> = {
      transactions: txs,
    };

    if (count) {
      output.totalTransactions = txCountOrStats;
    }

    return output;
  });
