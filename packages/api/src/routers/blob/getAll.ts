import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import {
  baseGetAllInputSchema,
  blobStorageSchema,
  rollupSchema,
} from "../../utils";
import { getAllOutputSchema } from "./getAll.schema";
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
  .input(baseGetAllInputSchema)
  .output(getAllOutputSchema)
  .use(withPagination)
  .query(async ({ input, ctx }) => {
    const { sort, endBlock, rollup, startBlock } = input;

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
            rollup,
            block: {
              number: {
                lt: endBlock,
                gte: startBlock,
              },
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
      rollup
        ? ctx.prisma.blob.count({
            where: {
              transactions: {
                some: {
                  transaction: {
                    rollup,
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
