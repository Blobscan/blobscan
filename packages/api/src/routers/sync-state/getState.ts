import { publicProcedure } from "../../procedures";

export const getState = publicProcedure.query(async ({ ctx }) => {
  const syncState = await ctx.prisma.blockchainSyncState.findUnique({
    select: {
      lastFinalizedBlock: true,
      lastSlot: true,
    },
    where: { id: 1 },
  });

  return (
    syncState ?? {
      lastFinalizedBlock: 0,
      lastSlot: 0,
    }
  );
});
