import type { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import { test } from "node:test";

import { backfillTransactions } from "./backfill";
import type { RpcCall } from "./transaction-rpc";

function setup(complete = false) {
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
    gasUsed: complete ? "0" : null,
    effectiveGasPrice: complete ? "0" : null,
    input: complete ? "0x" : null,
    executionStatus: complete ? "SUCCESS" : null,
    block: { blobGasPrice: "1", baseFeePerGas: complete ? "0" : null },
  };
  const db = {
    transaction: {
      findFirst: async () => ({ blockNumber: 100 }),
      findMany: async (args: {
        where: { blockNumber: { gte?: number; lte?: number } };
      }) => {
        assert.deepEqual(Object.keys(args.where), ["blockNumber"]);
        assert.ok(!("cursor" in args));
        assert.ok(!("skip" in args));
        assert.ok(!("take" in args));
        return stored.blockNumber >= args.where.blockNumber.gte! &&
          stored.blockNumber <= args.where.blockNumber.lte!
          ? [stored]
          : [];
      },
    },
    $executeRaw: async () => 1,
    $transaction: async (fn: (client: unknown) => Promise<void>) => {
      await fn(db);
      Object.assign(stored, {
        gasUsed: "21000",
        effectiveGasPrice: "3",
        input: "0x",
        executionStatus: "SUCCESS",
      });
      stored.block.baseFeePerGas = "2";
      writes++;
    },
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
      status: "0x1",
      gasUsed: "0x5208",
      effectiveGasPrice: "0x3",
      blobGasUsed: "0x20000",
      blobGasPrice: "0x1",
    };
  };
  return {
    stored,
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

test("complete records are skipped in memory, including zero values", async () => {
  const ctx = setup(true);
  await backfillTransactions({ ...ctx, from: 100, to: 100 });
  assert.deepEqual(ctx.stats(), { writes: 0, calls: 0, disconnects: 1 });
});

test("prints startup and fetch progress before the database responds", async (t) => {
  const ctx = setup();
  const messages: string[] = [];
  t.mock.method(console, "log", (message: string) => messages.push(message));
  ctx.prisma.transaction.findMany = (async () => {
    assert.match(messages[0]!, /Starting dry run.*100–101/);
    assert.ok(
      messages.some((message) => /Blocks 100–101: fetching/.test(message))
    );
    return [];
  }) as unknown as typeof ctx.prisma.transaction.findMany;
  await backfillTransactions({ ...ctx, from: 100, to: 101, dryRun: true });
  assert.match(messages.at(-1)!, /Complete/);
});

test("reads a shared block header once per database batch", async () => {
  const ctx = setup();
  const second = { ...ctx.stored, hash: `0x${"3".repeat(64)}` };
  let reads = 0;
  let headers = 0;
  ctx.prisma.transaction.findMany = (async () =>
    reads++
      ? []
      : [
          ctx.stored,
          second,
        ]) as unknown as typeof ctx.prisma.transaction.findMany;
  const rpc: RpcCall = async (method, params) => {
    const result = (await ctx.rpc(method, params)) as Record<string, unknown>;
    if (method === "eth_getBlockByNumber") {
      headers++;
      return result;
    }
    if (method === "eth_getTransactionByHash")
      return { ...result, hash: params[0] };
    return { ...result, transactionHash: params[0] };
  };
  await backfillTransactions({ ...ctx, rpc, dryRun: true });
  assert.equal(headers, 1);
  assert.equal(ctx.stats().calls, 5);
});

test("scans consecutive block windows through empty ranges and includes both bounds", async () => {
  const ctx = setup(true);
  const ranges: { gte: number; lte: number }[] = [];
  ctx.prisma.transaction.findMany = (async (args: {
    where: { blockNumber: { gte: number; lte: number } };
  }) => {
    ranges.push(args.where.blockNumber);
    assert.ok(!("cursor" in args));
    assert.ok(!("skip" in args));
    assert.ok(!("take" in args));
    return [];
  }) as unknown as typeof ctx.prisma.transaction.findMany;
  await backfillTransactions({ ...ctx, from: 100, to: 104, blockRangeSize: 2 });
  assert.deepEqual(ranges, [
    { gte: 100, lte: 101 },
    { gte: 102, lte: 103 },
    { gte: 104, lte: 104 },
  ]);
});

test("processes every transaction when a block exceeds the write batch size", async (t) => {
  const ctx = setup(true);
  const messages: string[] = [];
  t.mock.method(console, "log", (message: string) => messages.push(message));
  ctx.prisma.transaction.findMany = (async () =>
    Array.from({ length: 5 }, (_, i) => ({
      ...ctx.stored,
      hash: `0x${String(i + 1).repeat(64)}`,
    }))) as unknown as typeof ctx.prisma.transaction.findMany;
  await backfillTransactions({ ...ctx, from: 100, to: 100, batchSize: 2 });
  assert.ok(
    messages.some((message) => /Batch 3 complete; scanned: 5/.test(message))
  );
  assert.equal(ctx.stats().calls, 0);
});
