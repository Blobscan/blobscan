import type { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import { test } from "node:test";

import { backfillTransactions } from "./backfill";
import type { RpcCall } from "./transaction-rpc";

function setup() {
  let completed = false;
  let writes = 0;
  let calls = 0;
  let disconnects = 0;
  const hash = `0x${"1".repeat(64)}`;
  const blockHash = `0x${"2".repeat(64)}`;
  const stored = {
    hash,
    blockHash,
    blockNumber: 100,
    blobGasUsed: "131072",
    block: { blobGasPrice: "1" },
  };
  const db = {
    transaction: {
      findMany: async (args: { where: { hash?: { gt: string } } }) =>
        completed || args.where.hash ? [] : [stored],
      updateMany: async (args: {
        where: { hash: string; blockHash: string };
        data: unknown;
      }) => {
        assert.deepEqual(args.where, { hash, blockHash });
        assert.deepEqual(args.data, {
          gasUsed: "21000",
          effectiveGasPrice: "3",
          input: "0x",
        });
        writes++;
        return { count: 1 };
      },
    },
    block: {
      update: async () => {
        completed = true;
      },
    },
    $transaction: async (fn: (client: unknown) => Promise<void>) => fn(db),
    $disconnect: async () => {
      disconnects++;
    },
  };
  const rpc: RpcCall = async (method) => {
    calls++;
    if (method === "eth_getBlockByNumber")
      return { hash: blockHash, number: "0x64", baseFeePerGas: "0x2" };
    if (method === "eth_getTransactionByHash")
      return { hash, blockHash, blockNumber: "0x64", input: "0x" };
    return {
      transactionHash: hash,
      blockHash,
      blockNumber: "0x64",
      gasUsed: "0x5208",
      effectiveGasPrice: "0x3",
      blobGasUsed: "0x20000",
      blobGasPrice: "0x1",
    };
  };
  return {
    prisma: db as unknown as PrismaClient,
    rpc,
    stats: () => ({ writes, calls, disconnects }),
  };
}

test("dry run validates RPC data without writes", async () => {
  const ctx = setup();
  await backfillTransactions({ ...ctx, dryRun: true });
  assert.deepEqual(ctx.stats(), { writes: 0, calls: 3, disconnects: 1 });
});

test("a second run skips completed records", async () => {
  const ctx = setup();
  await backfillTransactions(ctx);
  await backfillTransactions(ctx);
  assert.deepEqual(ctx.stats(), { writes: 1, calls: 3, disconnects: 2 });
});

test("a failed RPC read remains eligible for the next run", async () => {
  const ctx = setup();
  await assert.rejects(
    backfillTransactions({ ...ctx, rpc: async () => null }),
    /1 transactions failed/
  );
  assert.equal(ctx.stats().writes, 0);
  await backfillTransactions(ctx);
  assert.equal(ctx.stats().writes, 1);
});
