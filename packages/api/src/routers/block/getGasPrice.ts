import { prisma } from "@blobscan/db";

import { publicProcedure } from "../../procedures";

export const getLatestGasPrice = publicProcedure.query(async () => {
  return await prisma.block.findFirst({
    where: {
      transactionForks: {
        none: {},
      },
    },
    orderBy: {
      number: "desc",
    },
    select: {
      blobGasPrice: true,
    },
  });
});
