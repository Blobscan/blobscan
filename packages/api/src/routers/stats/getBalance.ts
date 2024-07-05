import { z } from "@blobscan/zod";
import { env } from "../../env"
import { publicProcedure } from "../../procedures";
import { BASE_PATH } from "./common";
import { logger } from "@blobscan/logger";

export const inputSchema = z.object({
    address: z.string(),
});

export const outputSchema = z.object({
    balance: z.bigint(),
});

async function getBalanceQuery(address: string) {
    try {
        const response = await fetch(env.EXECUTION_NODE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
        });
        const data = await response.json();
        const balance = BigInt(data.result);
        return balance;
      } catch (error) {
        // Handle the error here
        logger.error("Error fetching balance:", error);
        return BigInt(-1);
      }
}

export const getBalance = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BASE_PATH}/balance`,
      tags: ["stats"],
      summary: "Get balance from an address.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(({ input }) => {
    const { address } = input;
    return getBalanceQuery(address).then((balance) => {
        return { balance: balance };
    });
  });
