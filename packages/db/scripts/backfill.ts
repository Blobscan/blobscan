import type { PrismaClient } from "@prisma/client";

import { getTransactionData, RpcDataError } from "./transaction-rpc";
import type { RpcCall } from "./transaction-rpc";
import { writeTransactionBatch } from "./write-transaction-batch";
import type { TransactionUpdate } from "./write-transaction-batch";

export async function backfillTransactions({
  prisma,
  rpc,
  from,
  to,
  batchSize = 100,
  blockRangeSize = 100,
  dryRun = false,
}: {
  prisma: PrismaClient;
  rpc: RpcCall;
  from?: number;
  to?: number;
  batchSize?: number;
  blockRangeSize?: number;
  dryRun?: boolean;
}) {
  let completed = 0;
  let failed = 0;
  let skipped = 0;
  let scanned = 0;
  let batch = 0;
  const startedAt = Date.now();
  const progress = () =>
    `scanned: ${scanned}; ${
      dryRun ? "validated" : "updated"
    }: ${completed}; already complete: ${skipped}; failed: ${failed}; elapsed: ${Math.floor(
      (Date.now() - startedAt) / 1000
    )}s`;
  console.log(
    `Starting ${dryRun ? "dry run" : "backfill"}. Blocks: ${from ?? "first"}–${
      to ?? "last"
    } (inclusive); batch size: ${batchSize}.`
  );
  try {
    console.log("Resolving block range…");
    const firstBlock =
      from ??
      (
        await prisma.transaction.findFirst({
          where: { blockNumber: { lte: to } },
          orderBy: { blockNumber: "asc" },
          select: { blockNumber: true },
        })
      )?.blockNumber;
    const lastBlock =
      to ??
      (
        await prisma.transaction.findFirst({
          where: { blockNumber: { gte: from } },
          orderBy: { blockNumber: "desc" },
          select: { blockNumber: true },
        })
      )?.blockNumber;
    for (
      let start = firstBlock ?? 0;
      firstBlock != null && lastBlock != null && start <= lastBlock;
      start += blockRangeSize
    ) {
      const end = Math.min(start + blockRangeSize - 1, lastBlock);
      console.log(`Blocks ${start}–${end}: fetching transactions…`);
      const windowTransactions = await prisma.transaction.findMany({
        where: { blockNumber: { gte: start, lte: end } },
        orderBy: [{ blockNumber: "asc" }, { index: "asc" }],
        select: {
          hash: true,
          blockHash: true,
          blockNumber: true,
          blobGasUsed: true,
          gasUsed: true,
          effectiveGasPrice: true,
          input: true,
          executionStatus: true,
          block: { select: { blobGasPrice: true, baseFeePerGas: true } },
        },
      });
      console.log(
        `Blocks ${start}–${end}: fetched ${windowTransactions.length} transactions.`
      );
      for (
        let offset = 0;
        offset < windowTransactions.length;
        offset += batchSize
      ) {
        batch++;
        const transactions = windowTransactions.slice(
          offset,
          offset + batchSize
        );
        const isComplete = (tx: (typeof transactions)[number]) =>
          tx.gasUsed != null &&
          tx.effectiveGasPrice != null &&
          tx.input != null &&
          tx.executionStatus != null &&
          tx.block.baseFeePerGas != null;
        const pending = transactions.filter((tx) => !isComplete(tx));
        console.log(
          `Batch ${batch}: reading RPC data for ${pending.length} incomplete transactions.`
        );
        const headers = new Map<string, Promise<unknown>>();
        const batchRpc: RpcCall = (method, params) => {
          if (method !== "eth_getBlockByNumber") return rpc(method, params);
          const key = JSON.stringify(params);
          let header = headers.get(key);
          if (!header) {
            header = rpc(method, params);
            headers.set(key, header);
          }
          return header;
        };
        const results = await Promise.allSettled(
          pending.map((tx) => getTransactionData(batchRpc, tx))
        );
        const dataByHash = new Map(
          pending.map((tx, index) => [tx.hash, results[index]!])
        );
        const updates: TransactionUpdate[] = [];
        for (const [index, tx] of transactions.entries()) {
          const position = `Batch ${batch}, transaction ${index + 1}/${
            transactions.length
          }, block ${tx.blockNumber}`;
          scanned++;
          if (isComplete(tx)) {
            skipped++;
            console.log(`${position}: already complete; ${progress()}`);
            continue;
          }
          console.log(`${position}: processing ${tx.hash}…`);
          try {
            const result = dataByHash.get(tx.hash)!;
            if (result.status === "rejected") throw result.reason;
            updates.push({
              hash: tx.hash,
              blockHash: tx.blockHash,
              blockNumber: tx.blockNumber,
              ...result.value,
            });
            if (dryRun) completed++;
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
          console.log(
            `${position}: ready to write: ${
              dryRun ? 0 : updates.length
            }; ${progress()}`
          );
        }
        if (!dryRun && updates.length) {
          console.log(
            `Batch ${batch}: writing ${updates.length} transactions…`
          );
          try {
            await writeTransactionBatch(prisma, updates);
            completed += updates.length;
            console.log(
              `Batch ${batch}: committed ${updates.length} transactions.`
            );
          } catch {
            failed += updates.length;
            console.error(
              `Batch ${batch}: database write failed; all ${updates.length} updates were rolled back. Run again to retry.`
            );
          }
        }
        console.log(`Batch ${batch} complete; ${progress()}`);
      }
    }
    if (failed)
      throw new Error(
        `${failed} transactions failed. Run the command again to retry them.`
      );
    console.log(
      `Complete. ${completed} transactions ${
        dryRun ? "validated" : "updated"
      }. ${progress()}`
    );
  } finally {
    await prisma.$disconnect();
  }
}
