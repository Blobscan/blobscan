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
import { normalize } from "../../utils";
import { countBlocks } from "./getCount";
import type { CompletedPrismaBlock } from "./helpers";
import {
  responseBlockSchema,
  createBlockSelect,
  toResponseBlock,
} from "./helpers";

const outputSchema = z
  .object({
    blocks: responseBlockSchema.array(),
    totalBlocks: z.number().optional(),
  })
  .transform(normalize);

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blocks",
      tags: ["blocks"],
      summary: "retrieves all blocks.",
    },
  })
  .input(withAllFiltersSchema)
  .use(withFilters)
  .input(createExpandsSchema(["transaction", "blob"]))
  .use(withExpands)
  .input(withPaginationSchema)
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

    const [prismaBlocks, totalBlocks] = await Promise.all([blocksOp, countOp]);

    return {
      blocks: prismaBlocks.map((prismaBlock) =>
        toResponseBlock(prismaBlock as unknown as CompletedPrismaBlock)
      ),
      ...(count ? { totalBlocks } : {}),
    };
  });
