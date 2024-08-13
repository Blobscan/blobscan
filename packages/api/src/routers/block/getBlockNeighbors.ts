import { prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

export const getBlockNeighbors = publicProcedure
  .input(
    z.object({
      blockNumber: z.number(),
    })
  )
  .query(async ({ input }) => {
    const previousBlock = await prisma.block.findFirst({
      where: { number: { lt: input.blockNumber } },
      orderBy: { number: "desc" },
    });

    const nextBlock = await prisma.block.findFirst({
      where: { number: { gt: input.blockNumber } },
      orderBy: { number: "asc" },
    });

    return { previousBlock, nextBlock };
  });
