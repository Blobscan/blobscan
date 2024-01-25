import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { fullBlockSelect } from "./common";
import { getAllInputSchema } from "./getAll.schema";

export const getAll = publicProcedure
  .input(getAllInputSchema)
  .use(withPagination)
  .query(async ({ input, ctx }) => {
    const [blocks, overallStats] = await Promise.all([
      ctx.prisma.block
        .findMany({
          select: fullBlockSelect,
          orderBy: { number: "desc" },
          ...ctx.pagination,
          where: {
            transactionForks: {
              ...(input?.reorgs ? { some: {} } : { none: {} }),
            },
          },
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
