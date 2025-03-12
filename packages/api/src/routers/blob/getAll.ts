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
import type { BlobOnTransaction } from "./common";
import {
  createBlobsOnTransactionsSelect,
  serializedBlobsOnTransactionsSchema,
} from "./common";
import { countBlobs } from "./getCount";

const inputSchema = withPaginationSchema
  .merge(withAllFiltersSchema)
  .merge(createExpandsSchema(["transaction", "block"]));

const outputSchema = z.object({
  blobs: serializedBlobsOnTransactionsSchema.array(),
  totalBlobs: z.number().optional(),
});

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs",
      tags: ["blobs"],
      summary: "retrieves all blobs.",
    },
  })
  .input(inputSchema)
  .use(withPagination)
  .use(withFilters)
  .use(withExpands)
  .output(outputSchema)
  .query(async ({ ctx: { filters, expands, pagination, prisma, count } }) => {
    const { blockFilters = {}, blockType, transactionFilters, sort } = filters;

    let leadingOrderColumn: Prisma.BlobsOnTransactionsOrderByWithRelationInput =
      {
        blockTimestamp: sort,
      };

    if (blockFilters.number) {
      leadingOrderColumn = {
        blockNumber: sort,
      };
    }

    const blobsOnTransactinonsOp = prisma.blobsOnTransactions.findMany({
      select: createBlobsOnTransactionsSelect(expands),
      where: {
        blockNumber: blockFilters.number,
        blockTimestamp: blockFilters.timestamp,
        block: {
          slot: blockFilters.slot,
          transactionForks: blockType,
        },

        transaction: transactionFilters,
      },
      orderBy: [
        leadingOrderColumn,
        { txIndex: sort },
        {
          index: sort,
        },
      ],
      ...pagination,
    });
    const countOp = count ? countBlobs(prisma, filters) : undefined;

    const [dbBlobsOnTxs, totalBlobs] = await Promise.all([
      blobsOnTransactinonsOp,
      countOp,
    ]);

    const blobsOnTransactions = dbBlobsOnTxs as unknown as BlobOnTransaction[];

    if (expands.transaction) {
      blobsOnTransactions.forEach(({ transaction }) => {
        if (transaction) {
          const {
            blobAsCalldataGasUsed,
            blobGasUsed,
            gasPrice,
            maxFeePerBlobGas,
            block,
          } = transaction;

          if (
            blobAsCalldataGasUsed &&
            blobGasUsed &&
            gasPrice &&
            maxFeePerBlobGas &&
            block?.blobGasPrice
          ) {
            const { blobAsCalldataGasFee, blobGasBaseFee, blobGasMaxFee } =
              calculateTxFeeFields({
                blobAsCalldataGasUsed,
                blobGasUsed,
                gasPrice,
                maxFeePerBlobGas,
                blobGasPrice: block.blobGasPrice,
              });

            transaction.blobAsCalldataGasFee = blobAsCalldataGasFee;
            transaction.blobGasBaseFee = blobGasBaseFee;
            transaction.blobGasMaxFee = blobGasMaxFee;
          }
        }
      });
    }

    const output: z.input<typeof outputSchema> = {
      blobs: blobsOnTransactions,
    };

    if (count) {
      output.totalBlobs = totalBlobs;
    }

    return output;
  });
