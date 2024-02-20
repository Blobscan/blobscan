import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";

export const getAll = publicProcedure
  .input(paginationSchema.optional())
  .use(withPagination)
  .query(async ({ ctx }) => {
    const [blobs, overallStats] = await Promise.all([
      ctx.prisma.blob.findMany({
        select: {
          versionedHash: true,
          commitment: true,
          proof: true,
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
