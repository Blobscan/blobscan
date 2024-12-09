import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

export const checkBlockExists = publicProcedure
  .input(
    z.object({
      blockNumber: z.number(),
    })
  )
  .query(async ({ ctx: { prisma }, input }) => {
    const block = await prisma.block.findFirst({
      where: {
        number: input.blockNumber,
      },
      select: {
        number: true,
      },
    });

    return Boolean(block);
  });
