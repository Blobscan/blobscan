import { z } from "@blobscan/zod";
import { env } from "../../env"
import { publicProcedure } from "../../procedures";
import { BASE_PATH } from "./common";

export const inputSchema = z.object({
    address: z.string(),
});

export const outputSchema = z.object({
    balance: z.bigint(),
});

async function getBalanceQuery(address: string) {
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
//   logger.info(data);
  const balance = BigInt(data.result);
  return balance;
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
