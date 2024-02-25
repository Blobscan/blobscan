import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { getAllOutputSchema } from "./getAll.schema";

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs",
      tags: ["blobs"],
      summary: "get blobs",
    },
  })
  .input(paginationSchema.optional())
  .output(getAllOutputSchema)
  .use(withPagination)
  .query(async ({ ctx }) => {
    const [blobs, overallStats] = await Promise.all([
      ctx.prisma.blob.findMany({
        select: {
          versionedHash: true,
          commitment: true,
          size: true,
        },
        ...ctx.pagination,
      }),
      ctx.prisma.blobOverallStats.findFirst({
        select: {
          totalBlobs: true,
        },
      }),
    ]);

    return {
      blobs,
      totalBlobs: overallStats?.totalBlobs ?? 0,
    };
  });
