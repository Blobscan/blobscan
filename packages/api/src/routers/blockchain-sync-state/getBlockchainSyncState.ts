import { publicProcedure } from "../../procedures";

export const getBlockchainSyncState = publicProcedure.query(async ({ ctx }) => {
  return ctx.prisma.blockchainSyncState.findUnique({
    where: { id: 1 },
  });
});
