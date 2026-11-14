import type { PrismaClient } from "@prisma/client";

import { getTransactionData, RpcDataError } from "./transaction-rpc";
import type { RpcCall } from "./transaction-rpc";

export async function backfillTransactions({
  prisma,
  rpc,
  from,
  to,
  batchSize = 100,
  dryRun = false,
}: {
  prisma: PrismaClient;
  rpc: RpcCall;
  from?: number;
  to?: number;
  batchSize?: number;
  dryRun?: boolean;
}) {
  let cursor: string | undefined;
  let completed = 0;
  let failed = 0;
  try {
    for (;;) {
      const transactions = await prisma.transaction.findMany({
        where: {
          hash: cursor ? { gt: cursor } : undefined,
          blockNumber: { gte: from, lte: to },
          OR: [
            { gasUsed: null },
            { effectiveGasPrice: null },
            { input: null },
            { block: { baseFeePerGas: null } },
          ],
        },
        orderBy: { hash: "asc" },
        take: batchSize,
        select: {
          hash: true,
          blockHash: true,
          blockNumber: true,
          blobGasUsed: true,
          block: { select: { blobGasPrice: true } },
        },
      });
      if (!transactions.length) break;
      for (const tx of transactions) {
        try {
          const { baseFeePerGas, ...data } = await getTransactionData(rpc, tx);
          if (!dryRun) {
            await prisma.$transaction(async (db) => {
              const result = await db.transaction.updateMany({
                where: { hash: tx.hash, blockHash: tx.blockHash },
                data,
              });
              if (result.count !== 1)
                throw new Error("Transaction changed during backfill");
              await db.block.update({
                where: { hash: tx.blockHash },
                data: { baseFeePerGas },
              });
            });
          }
          completed++;
        } catch (error) {
          failed++;
          // Database errors can contain connection details.
          console.error(
            `Skipped ${tx.hash}: ${
              error instanceof RpcDataError
                ? error.message
                : "Database update failed"
            }`
          );
        }
      }
      cursor = transactions[transactions.length - 1]!.hash;
      console.log(
        `${dryRun ? "Validated" : "Updated"}: ${completed}; failed: ${failed}`
      );
    }
    if (failed)
      throw new Error(
        `${failed} transactions failed. Run the command again to retry them.`
      );
    console.log(
      `Complete. ${completed} transactions ${dryRun ? "validated" : "updated"}.`
    );
  } finally {
    await prisma.$disconnect();
  }
}
