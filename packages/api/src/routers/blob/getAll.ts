import type { Rollup } from "@blobscan/db";

import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { getAllInputSchema, getAllOutputSchema } from "./getAll.schema";

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
  .query(async ({ input, ctx }) => {
    const sourceRollup = input?.rollup?.toUpperCase() as Rollup | undefined;

    const [blobs, blobCountOrStats] = await Promise.all([
      ctx.prisma.blob.findMany({
        select: {
          versionedHash: true,
          commitment: true,
          proof: true,
          size: true,
        },
        where: {
          transactions: {
            some: {
              transaction: {
                sourceRollup,
              },
            },
          },
        },
        ...ctx.pagination,
      }),
      sourceRollup
        ? ctx.prisma.blob.count({
            where: {
              transactions: {
                some: {
                  transaction: {
                    sourceRollup,
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

    return {
      blobs,
      totalBlobs:
        typeof blobCountOrStats === "number"
          ? blobCountOrStats
          : blobCountOrStats?.totalBlobs ?? 0,
    };
  });
