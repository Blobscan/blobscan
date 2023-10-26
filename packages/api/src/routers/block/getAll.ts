import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { fullBlockSelect } from "./common";

export const getAll = publicProcedure
  .input(paginationSchema)
  .use(withPagination)
  .query(async ({ ctx }) => {
    const [blocks, overallStats] = await Promise.all([
      ctx.prisma.block
        .findMany({
          select: fullBlockSelect,
          orderBy: { number: "desc" },
          ...ctx.pagination,
        })
        .then((blocks) =>
          blocks.map((b) => ({
            ...b,
            blobAsCalldataGasUsed: b.blobAsCalldataGasUsed.toFixed(),
            blobGasUsed: b.blobGasUsed.toFixed(),
            excessBlobGas: b.excessBlobGas.toFixed(),
            blobGasPrice: b.blobGasPrice.toFixed(),
          }))
        ),
      ctx.prisma.blockOverallStats.findFirst({
        select: {
          totalBlocks: true,
        },
      }),
    ]);

    return {
      blocks,
      totalBlocks: overallStats?.totalBlocks ?? 0,
    };
  });
