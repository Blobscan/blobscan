import { createTRPCRouter, publicProcedure } from "../trpc";

export const syncStateRouter = createTRPCRouter({
  getSyncState: publicProcedure.query(async ({ ctx }) => {
    const syncState = await ctx.prisma.blockchainSyncState.findUnique({
      select: {
        lastFinalizedBlock: true,
        lastSlot: true,
      },
      where: { id: 1 },
    });

    console.log(syncState);
    return (
      syncState ?? {
        lastFinalizedBlock: 0,
        lastSlot: 0,
      }
    );
  }),
});
