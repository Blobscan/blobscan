import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";

export const getLatest = publicProcedure.query(async ({ ctx: { prisma } }) => {
  const latestBlock = await prisma.block.findLatest();

  return normalize(latestBlock);
});
