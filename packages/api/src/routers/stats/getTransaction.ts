import { z } from "@blobscan/zod";
import { env } from "../../env"
import { publicProcedure } from "../../procedures";
import { BASE_PATH } from "./common";
import { logger } from "@blobscan/logger"

export const inputSchema = z.object({
    hash: z.string(),
});

export const outputSchema = z.object({
    data: z.object({
        blockHash: z.string(),
        blockNumber: z.string(),
        from: z.string(),
        gas: z.string(),
        gasPrice: z.string(),
        hash: z.string(),
        input: z.string(),
        nonce: z.string(),
        to: z.string(),
        transactionIndex: z.string(),
        value: z.string(),
        type: z.string(),
        chainId: z.string(),
        v: z.string(),
        r: z.string(),
        s: z.string(),
    })
});

async function getTransactionQuery(txHash: string) {
    try {
        const response = await fetch(env.EXECUTION_NODE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionByHash',
            params: [txHash],
            id: 1,
          }),
        });
        const data = await response.json();
        const transaction = data.result;
        return transaction;
      } catch (error) {
        // Handle the error here
        logger.error("Error fetching balance:", error);
        return {};
      }
}

export const getTransaction = publicProcedure
    .meta({
        openapi: {
            method: "GET",
            path: `/${BASE_PATH}/transaction`,
            tags: ["stats"],
            summary: "Get transaction detail.",
        },
    })
    .input(inputSchema)
    .output(outputSchema)
    .query(({ input }) => {
        const { hash } = input;
        return getTransactionQuery(hash).then((transaction) => {
            return { data: transaction };
        });
      });
