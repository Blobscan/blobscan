import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const inputSchema = z
  .object({
    timestamp: z.coerce.date(),
  })
  .optional();

const outputSchema = z.object({
  usdPrice: z.number(),
  timestamp: z.date(),
});

export const getByTimestamp = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/eth-price",
      tags: ["eth-price"],
      summary: "retrieves ETH price for given timestamp.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input: { timestamp } = {} }) => {
    const dbPrice = await prisma.ethUsdPrice.findFirst({
      where: {
        timestamp: timestamp
          ? {
              gte: timestamp,
            }
          : undefined,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (!dbPrice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No ETH price found for ${
          timestamp
            ? `timestamp '${timestamp.toISOString()}'`
            : "latest timestamp"
        }`,
      });
    }

    return {
      usdPrice: dbPrice.price.toNumber(),
      timestamp: dbPrice.timestamp,
    };
  });
