import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import type { getTransactionData, StoredTransaction } from "./transaction-rpc";

export type TransactionUpdate = Pick<
  StoredTransaction,
  "hash" | "blockHash" | "blockNumber"
> &
  Awaited<ReturnType<typeof getTransactionData>>;

export async function writeTransactionBatch(
  prisma: PrismaClient,
  updates: TransactionUpdate[]
) {
  if (!updates.length) return;
  const blocks = new Map<string, string>();
  for (const tx of updates) {
    const existing = blocks.get(tx.blockHash);
    if (existing !== undefined && existing !== tx.baseFeePerGas) {
      throw new Error("Conflicting block base fees");
    }
    blocks.set(tx.blockHash, tx.baseFeePerGas);
  }
  await prisma.$transaction(
    async (db) => {
      const count = await db.$executeRaw(Prisma.sql`
      UPDATE "transaction" AS tx
      SET gas_used = data.gas_used,
          effective_gas_price = data.effective_gas_price,
          input = data.input,
          execution_status = data.execution_status,
          updated_at = NOW()
      FROM (VALUES ${Prisma.join(
        updates.map(
          (tx) => Prisma.sql`(
        ${tx.hash}::text, ${tx.blockHash}::text, ${tx.blockNumber}::integer,
        ${tx.gasUsed}::numeric, ${tx.effectiveGasPrice}::numeric,
        ${tx.input}::text, ${tx.executionStatus.toLowerCase()}::execution_status
      )`
        )
      )}) AS data(hash, block_hash, block_number, gas_used, effective_gas_price, input, execution_status)
      WHERE tx.hash = data.hash AND tx.block_hash = data.block_hash
        AND tx.block_number = data.block_number
    `);
      if (count !== updates.length)
        throw new Error("Transaction changed during backfill");
      const blockCount = await db.$executeRaw(Prisma.sql`
      UPDATE block AS b
      SET base_fee_per_gas = data.base_fee_per_gas, updated_at = NOW()
      FROM (VALUES ${Prisma.join(
        [...blocks].map(
          ([hash, fee]) => Prisma.sql`(
        ${hash}::text, ${fee}::numeric
      )`
        )
      )}) AS data(hash, base_fee_per_gas)
      WHERE b.hash = data.hash
    `);
      if (blockCount !== blocks.size)
        throw new Error("Block changed during backfill");
    },
    { timeout: 30_000 }
  );
}
