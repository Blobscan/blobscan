import { withExpands } from "../../middlewares/withExpands";
import { withFilters } from "../../middlewares/withFilters";
import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { createBlobsOnTransactionsSelect } from "./common/selects";
import { serializeBlobOnTransaction } from "./common/serializers";
import { getAllInputSchema, getAllOutputSchema } from "./getAll.schemas";
import type { GetAllOutput } from "./getAll.schemas";

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs",
      tags: ["blobs"],
      summary: "retrieves all blobs.",
    },
  })
  .input(getAllInputSchema)
  .output(getAllOutputSchema)
  .use(withPagination)
  .use(withFilters)
  .use(withExpands)
  .query(async ({ ctx }) => {
    const {
      blockRangeFilter,
      slotRangeFilter,
      sort,
      typeFilter,
      rollupFilter,
    } = ctx.filters;

    const [txsBlobs, blobCountOrStats] = await Promise.all([
      ctx.prisma.blobsOnTransactions.findMany({
        select: createBlobsOnTransactionsSelect(ctx.expands),
        where: {
          transaction: {
            rollup: rollupFilter,
            block: {
              ...blockRangeFilter,
              ...slotRangeFilter,
              ...typeFilter,
            },
          },
        },
        orderBy: [
          {
            transaction: {
              block: {
                number: sort,
              },
            },
          },
          {
            txHash: sort,
          },
          {
            index: sort,
          },
        ],
        ...ctx.pagination,
      }),
      // TODO: this is a workaround while we don't have proper rollup counts on the overall stats
      rollupFilter
        ? ctx.prisma.blob.count({
            where: {
              transactions: {
                some: {
                  transaction: {
                    rollup: rollupFilter,
                  },
                },
              },
            },
          })
        : ctx.prisma.blobOverallStats.findFirst({
            select: {
              totalBlobs: true,
            },
          }),
    ]);

    const serializedBlobs: GetAllOutput["blobs"] = txsBlobs.map(
      serializeBlobOnTransaction
    );

    return {
      blobs: serializedBlobs,
      totalBlobs:
        typeof blobCountOrStats === "number"
          ? blobCountOrStats
          : blobCountOrStats?.totalBlobs ?? 0,
    };
  });
