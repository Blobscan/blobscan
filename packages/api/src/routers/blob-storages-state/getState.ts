import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

export const inputSchema = z.void();

export const outputSchema = z.object({
  swarmDataId: z.string().nullable(),
  swarmDataTTL: z.number().nullable(),
});

export const getState = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx }) => {
    const state = await ctx.prisma.blobStoragesState.findUnique({
      select: {
        swarmDataId: true,
        swarmDataTTL: true,
      },
      where: { id: 1 },
    });

    return (
      state ?? {
        swarmDataId: null,
        swarmDataTTL: null,
      }
    );
  });
