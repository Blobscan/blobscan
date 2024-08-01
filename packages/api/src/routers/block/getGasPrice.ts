import { prisma } from "@blobscan/db";

import { publicProcedure } from "../../procedures";

export const getLatestBlock = publicProcedure.query(async () => {
  return await prisma.block.findLatest();
});
