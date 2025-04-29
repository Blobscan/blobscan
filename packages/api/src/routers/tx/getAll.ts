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
import type { IncompletedTransaction } from "./common";
import {
  createTransactionSelect,
  serializeTransaction,
  serializedTransactionSchema,
} from "./common";
import { countTxs } from "./getCount";

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
  .input(withAllFiltersSchema)
  .use(withFilters)
  .input(createExpandsSchema(["block", "blob"]))
  .use(withExpands)
  .input(withPaginationSchema)
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
    }) as unknown as IncompletedTransaction[];

    const countOp = count
      ? countTxs(prisma, filters)
      : Promise.resolve(undefined);

    const [queriedTxs, txCountOrStats] = await Promise.all([
      transactionsOp,
      countOp,
    ]);

    const txs = queriedTxs.map((dbTx) => {
      const feeFields = calculateTxFeeFields({
        blobAsCalldataGasUsed: dbTx.blobAsCalldataGasUsed,
        blobGasUsed: dbTx.blobGasUsed,
        gasPrice: dbTx.gasPrice,
        maxFeePerBlobGas: dbTx.maxFeePerBlobGas,
        blobGasPrice: dbTx.block.blobGasPrice,
      });

      return {
        ...dbTx,
        ...feeFields,
      };
    });

    const output: z.infer<typeof outputSchema> = {
      transactions: txs.map(serializeTransaction),
    };

    if (count) {
      output.totalTransactions = txCountOrStats;
    }

    return output;
  });
