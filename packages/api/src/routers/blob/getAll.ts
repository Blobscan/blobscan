import { withFilters } from "../../middlewares/withFilters";
import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { blobStorageSchema, rollupSchema } from "../../utils";
import { getAllInputSchema, getAllOutputSchema } from "./getAll.schema";
import type { GetAllOutput } from "./getAll.schema";

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
        select: {
          index: true,
          blob: {
            select: {
              commitment: true,
              proof: true,
              size: true,
              versionedHash: true,
              dataStorageReferences: {
                select: {
                  dataReference: true,
                  blobStorage: true,
                },
              },
            },
          },
          transaction: {
            select: {
              hash: true,
              rollup: true,
              block: {
                select: {
                  timestamp: true,
                  number: true,
                  slot: true,
                },
              },
            },
          },
        },
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

    const serializedBlobs: GetAllOutput["blobs"] = txsBlobs.map((txBlob) => {
      const block = txBlob.transaction.block;
      const tx = txBlob.transaction;
      const dataStorageReferences = txBlob.blob.dataStorageReferences.map(
        (storageRef) => ({
          blobStorage: blobStorageSchema.parse(
            storageRef.blobStorage.toLowerCase()
          ),
          dataReference: storageRef.dataReference,
        })
      );

      return {
        ...txBlob.blob,
        dataStorageReferences,
        rollup: tx.rollup ? rollupSchema.parse(tx.rollup.toLowerCase()) : null,
        timestamp: block.timestamp.toISOString(),
        index: txBlob.index,
        txHash: tx.hash,
        blockNumber: block.number,
        slot: block.slot,
      };
    });

    return {
      blobs: serializedBlobs,
      totalBlobs:
        typeof blobCountOrStats === "number"
          ? blobCountOrStats
          : blobCountOrStats?.totalBlobs ?? 0,
    };
  });
