import { Prisma } from "@blobscan/db";
import { OverallStatsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { BLOCK_BASE_PATH } from "./helpers";

const inputSchema = z.void();

const responseBlockOverallStatsSchema = OverallStatsModel.pick({
  totalBlocks: true,
  totalBlobGasUsed: true,
  totalBlobAsCalldataGasUsed: true,
  totalBlobFee: true,
  totalBlobAsCalldataFee: true,
  avgBlobFee: true,
  avgBlobAsCalldataFee: true,
  avgBlobGasPrice: true,
  updatedAt: true,
});

export const outputSchema =
  responseBlockOverallStatsSchema.transform(normalize);

export const getBlockOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BLOCK_BASE_PATH}/overall`,
      tags: ["stats"],
      summary: "retrieves blocks overall stats.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma } }) =>
    prisma.overallStats
      .findFirst({
        where: { category: null, rollup: null },
      })
      .then(
        (stats) =>
          stats ?? {
            totalBlocks: 0,
            totalBlobGasPrice: new Prisma.Decimal(0),
            totalBlobGasUsed: new Prisma.Decimal(0),
            totalBlobAsCalldataGasUsed: new Prisma.Decimal(0),
            totalBlobFee: new Prisma.Decimal(0),
            totalBlobAsCalldataFee: new Prisma.Decimal(0),
            avgBlobFee: 0,
            avgBlobAsCalldataFee: 0,
            avgBlobGasPrice: 0,
            updatedAt: new Date(),
          }
      )
  );
