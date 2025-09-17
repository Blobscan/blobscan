import { publicProcedure } from "../../procedures";

export const getLatestBlock = publicProcedure.query(
  async ({ ctx: { prisma } }) => {
    return await prisma.block.findLatest();
  }
);
