import { BlobStoragesStateModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";

export const inputSchema = z.void();

BlobStoragesStateModel.omit({
  id: true,
  updatedAt: true,
});
export const outputSchema = BlobStoragesStateModel.omit({
  id: true,
  updatedAt: true,
}).transform(normalize);

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
