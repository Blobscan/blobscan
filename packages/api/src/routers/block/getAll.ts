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
import { calculateDerivedTxBlobGasFields } from "../../utils";
import {
  createBlockSelect,
  serializeBlock,
  serializedBlockSchema,
} from "./common";
import type { QueriedBlock } from "./common";
import { countBlocks } from "./getCount";

const inputSchema = withAllFiltersSchema
  .merge(createExpandsSchema(["transaction", "blob"]))
  .merge(withPaginationSchema)
  .optional();

const outputSchema = z.object({
  blocks: serializedBlockSchema.array(),
  totalBlocks: z.number().optional(),
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
  .query(async ({ ctx: { expands, filters, pagination, prisma, count } }) => {
    const transactionFiltersExists =
      filters.transactionCategory ||
      filters.transactionRollup ||
      filters.transactionAddresses?.length;
    const sortColumn: Prisma.BlockOrderByWithRelationInput =
      filters.blockTimestamp
        ? { timestamp: filters.sort }
        : { number: filters.sort };

    const blocksOp = prisma.block.findMany({
      select: createBlockSelect(expands, filters),
      where: {
        number: filters.blockNumber,
        timestamp: filters.blockTimestamp,
        slot: filters.blockSlot,
        transactionForks: filters.blockType,
        transactions: transactionFiltersExists
          ? {
              some: {
                category: filters.transactionCategory,
                rollup: filters.transactionRollup,
                OR: filters.transactionAddresses,
              },
            }
          : undefined,
      },
      orderBy: sortColumn,
      ...pagination,
    });
    const countOp = count
      ? countBlocks(prisma, filters)
      : Promise.resolve(undefined);

    const [queriedBlocks, totalBlocks] = await Promise.all([blocksOp, countOp]);

    let blocks: QueriedBlock[] = queriedBlocks;

    if (expands.transaction) {
      blocks = blocks.map((block) => ({
        ...block,
        transactions: block.transactions.map((tx) => {
          const {
            maxFeePerBlobGas,
            blobAsCalldataGasUsed,
            gasPrice,
            blobGasUsed,
          } = tx;

          const derivedTxFields =
            maxFeePerBlobGas && blobAsCalldataGasUsed && gasPrice && blobGasUsed
              ? calculateDerivedTxBlobGasFields({
                  blobAsCalldataGasUsed,
                  blobGasUsed,
                  gasPrice,
                  blobGasPrice: block.blobGasPrice,
                  maxFeePerBlobGas,
                })
              : {};

          return {
            ...tx,
            ...derivedTxFields,
          };
        }),
      }));
    }

    return {
      blocks: blocks.map(serializeBlock),
      ...(count ? { totalBlocks } : {}),
    };
  });
