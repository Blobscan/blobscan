import type { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
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
import { paginate, paginationResponseSchema } from "../../pagination";
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
    pagination: paginationResponseSchema,
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
  .use(withBlobSignedUrls)
  .query(async ({ ctx: { expands, filters, pagination, prisma, count } }) => {
    const {
      blockFilters = {},
      blockType,
      transactionFilters = {},
      sort,
    } = filters;

    const baseWhere: Prisma.BlockWhereInput = {
      ...blockFilters,
      transactionForks: blockType,
      transactions: transactionFilters
        ? { some: transactionFilters }
        : undefined,
    };

    const blocksOp = paginate({
      sort,
      ...pagination,
      fields: blockFilters.slot
        ? [{ name: "slot", type: "number" }]
        : [
            { name: "number", type: "number" },
            { name: "slot", type: "number" },
          ],
      fetchPage: ({ where, orderBy, take }) =>
        prisma.block.findMany({
          select: createBlockSelect(expands, filters),
          where: {
            AND: [baseWhere, where as Prisma.BlockWhereInput],
          },
          orderBy: orderBy as Prisma.BlockOrderByWithRelationInput[],
          take,
        }),
      hasPage: (where) =>
        prisma.block
          .findFirst({
            where: { AND: [baseWhere, where as Prisma.BlockWhereInput] },
            select: { hash: true },
          })
          .then(Boolean),
    });
    const countOp = count
      ? countBlocks(prisma, filters)
      : Promise.resolve(undefined);

    const [{ items: prismaBlocks, pagination: pageInfo }, totalBlocks] =
      await Promise.all([blocksOp, countOp]);

    return {
      pagination: pageInfo,
      blocks: prismaBlocks.map((prismaBlock) =>
        toResponseBlock(prismaBlock as unknown as CompletedPrismaBlock)
      ),
      ...(count ? { totalBlocks } : {}),
    };
  });
