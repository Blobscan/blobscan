import type { BlobscanPrismaClient } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { Filters } from "../../middlewares/withFilters";
import {
  hasCustomFilters,
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";

const inputSchema = withAllFiltersSchema;

const outputSchema = z
  .object({
    totalBlocks: z.number(),
  })
  .transform(normalize);

export async function countBlocks(
  prisma: BlobscanPrismaClient,
  filters: Filters
) {
  if (!hasCustomFilters(filters)) {
    const overallStats = await prisma.overallStats.findFirst({
      select: {
        totalBlocks: true,
      },
      where: {
        category: null,
        rollup: null,
      },
    });

    return overallStats?.totalBlocks ?? 0;
  }

  const { blockFilters = {}, blockType, transactionFilters } = filters;

  return prisma.block.count({
    where: {
      ...blockFilters,
      transactionForks: blockType,
      transactions: transactionFilters
        ? {
            some: transactionFilters,
          }
        : undefined,
    },
  });
}

export const getCount = publicProcedure
  .input(inputSchema)
  .use(withFilters)
  .output(outputSchema)
  .query(async ({ ctx: { filters, prisma } }) => {
    const blocksCount = await countBlocks(prisma, filters);

    return {
      totalBlocks: blocksCount,
    };
  });
