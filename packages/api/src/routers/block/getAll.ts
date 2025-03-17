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
import type { CompletePrismaBlock } from "./common";
import { createBlockSelect, serializedBlockSchema } from "./common";
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
    const {
      blockFilters = {},
      blockType,
      transactionFilters = {},
      sort,
    } = filters;

    const blocksOp = prisma.block.findMany({
      select: createBlockSelect(expands, filters),
      where: {
        ...blockFilters,
        transactionForks: blockType,
        transactions: transactionFilters
          ? {
              some: transactionFilters,
            }
          : undefined,
      },
      orderBy: { number: sort },
      ...pagination,
    });
    const countOp = count
      ? countBlocks(prisma, filters)
      : Promise.resolve(undefined);

    const [dbBlocks_, totalBlocks] = await Promise.all([blocksOp, countOp]);
    const dbBlocks = dbBlocks_ as unknown as CompletePrismaBlock[];

    return {
      blocks: dbBlocks,
      ...(count ? { totalBlocks } : {}),
    };
  });
