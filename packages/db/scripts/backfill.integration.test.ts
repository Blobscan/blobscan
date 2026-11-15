import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const databaseUrl = process.env.TEST_DATABASE_URL;
const enabled = Boolean(databaseUrl);
const prisma = enabled
  ? new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  : undefined;
const hashes = [1, 2, 3].map((n) => `0x${n.toString().padStart(64, "0")}`);
const blockHashes = [4, 5, 6].map((n) => `0x${n.toString().padStart(64, "0")}`);
const sender = "fee-backfill-test-sender";
const receiver = "fee-backfill-test-receiver";
let requests = 0;
let transientFailures = 0;
let invalidReceipt = false;
let moveTransaction = false;
let rpcUrl: string;

const server = createServer((req, res) => {
  void (async () => {
    try {
      let body = "";
      for await (const chunk of req) body += String(chunk);
      const { id, method, params } = JSON.parse(body) as {
        id: number;
        method: string;
        params: string[];
      };
      requests++;
      if (transientFailures > 0) {
        transientFailures--;
        res.writeHead(429).end();
        return;
      }
      const index =
        method === "eth_getBlockByNumber"
          ? Number(BigInt(params[0]!)) - 100
          : hashes.indexOf(params[0]!);
      assert.ok(index >= 0 && index < hashes.length);
      const blockNumber = `0x${(100 + index).toString(16)}`;
      const identity = { blockHash: blockHashes[index], blockNumber };
      let result: unknown;
      if (method === "eth_getBlockByNumber") {
        result = {
          hash: blockHashes[index],
          number: blockNumber,
          baseFeePerGas: "0x2",
        };
      } else if (method === "eth_getTransactionByHash") {
        result = {
          ...identity,
          hash: hashes[index],
          input: index === 0 ? "0x0012" : "0x",
        };
      } else {
        assert.equal(method, "eth_getTransactionReceipt");
        if (moveTransaction && index === 0) {
          await prisma!.transaction.update({
            where: { hash: hashes[0] },
            data: { blockHash: blockHashes[1], blockNumber: 101 },
          });
        }
        result = {
          ...identity,
          transactionHash: hashes[index],
          status: index === 0 ? "0x0" : "0x1",
          gasUsed: "0x5208",
          effectiveGasPrice: "0x3",
          blobGasUsed: "0x20000",
          blobGasPrice: invalidReceipt && index === 0 ? "0x9" : "0x1",
        };
      }
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ jsonrpc: "2.0", id, result }));
    } catch {
      res.writeHead(500).end();
    }
  })();
});

before(async () => {
  if (!prisma) return;
  await prisma.address.createMany({
    data: [{ address: sender }, { address: receiver }],
    skipDuplicates: true,
  });
  for (let i = 0; i < 3; i++) {
    const timestamp = new Date(Date.UTC(2030, 0, 1, 0, 0, i * 12));
    await prisma.block.create({
      data: {
        hash: blockHashes[i]!,
        number: 100 + i,
        timestamp,
        slot: 1000000000 + i,
        blobGasUsed: "131072",
        blobGasPrice: "1",
        excessBlobGas: "0",
        blobAsCalldataGasUsed: "0",
      },
    });
    await prisma.transaction.create({
      data: {
        hash: hashes[i]!,
        blockHash: blockHashes[i]!,
        blockNumber: 100 + i,
        blockTimestamp: timestamp,
        fromId: sender,
        toId: receiver,
        gasPrice: "9",
        maxFeePerBlobGas: "10",
        blobGasUsed: "131072",
        blobAsCalldataGasUsed: "0",
      },
    });
  }
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  rpcUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(async () => {
  if (!prisma) return;
  requests = 0;
  transientFailures = 0;
  invalidReceipt = false;
  moveTransaction = false;
  for (let i = 0; i < 3; i++) {
    await prisma.transaction.update({
      where: { hash: hashes[i] },
      data: {
        blockHash: blockHashes[i],
        blockNumber: 100 + i,
        executionStatus: null,
        gasUsed: null,
        effectiveGasPrice: null,
        input: null,
      },
    });
  }
  await prisma.block.updateMany({
    where: { hash: { in: blockHashes } },
    data: { baseFeePerGas: null },
  });
});

after(async () => {
  if (!prisma) return;
  if (server.listening)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  await prisma.transaction.deleteMany({ where: { hash: { in: hashes } } });
  await prisma.block.deleteMany({ where: { hash: { in: blockHashes } } });
  await prisma.address.deleteMany({
    where: { address: { in: [sender, receiver] } },
  });
  await prisma.$disconnect();
});

async function run(...args: string[]) {
  try {
    const result = await promisify(execFile)(
      process.execPath,
      [
        "--import",
        "tsx",
        fileURLToPath(new URL("./backfill-transactions.ts", import.meta.url)),
        "--rpc-url",
        rpcUrl,
        ...args,
      ],
      {
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          DIRECT_URL: databaseUrl,
        },
      }
    );
    return { ...result, code: 0 };
  } catch (error) {
    return error as { stdout: string; stderr: string; code: number };
  }
}

test(
  "CLI dry run does not write and respects block ranges",
  { skip: !enabled },
  async () => {
    const result = await run(
      "--from-block",
      "100",
      "--to-block",
      "100",
      "--dry-run"
    );
    assert.equal(result.code, 0, result.stderr);
    assert.equal(requests, 3);
    assert.equal(
      await prisma!.transaction.count({
        where: { hash: { in: hashes }, gasUsed: { not: null } },
      }),
      0
    );
    assert.equal(
      await prisma!.block.count({
        where: { hash: { in: blockHashes }, baseFeePerGas: { not: null } },
      }),
      0
    );
  }
);

test(
  "CLI processes batches and skips completed records on restart",
  { skip: !enabled },
  async () => {
    const args = [
      "--from-block",
      "100",
      "--to-block",
      "101",
      "--batch-size",
      "1",
    ];
    const result = await run(...args);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(requests, 6);
    const tx = await prisma!.transaction.findUniqueOrThrow({
      where: { hash: hashes[0] },
    });
    assert.equal(tx.gasUsed?.toString(), "21000");
    assert.equal(tx.effectiveGasPrice?.toString(), "3");
    assert.equal(tx.executionStatus, "FAILED");
    assert.equal(tx.gasPrice.toString(), "9");
    assert.equal(tx.input, "0x0012");
    assert.equal(
      (
        await prisma!.transaction.findUniqueOrThrow({
          where: { hash: hashes[2] },
        })
      ).gasUsed,
      null
    );
    assert.equal((await run(...args)).code, 0);
    assert.equal(requests, 6);
  }
);

test(
  "CLI keeps failed records eligible without repeating successful writes",
  { skip: !enabled },
  async () => {
    invalidReceipt = true;
    const args = ["--from-block", "100", "--to-block", "101"];
    const result = await run(...args);
    assert.equal(result.code, 1);
    assert.ok(result.stderr.includes(hashes[0]!));
    invalidReceipt = false;
    assert.equal((await run(...args)).code, 0);
    assert.equal(requests, 9);
  }
);

test(
  "CLI rejects a transaction that moves blocks before the write",
  { skip: !enabled },
  async () => {
    moveTransaction = true;
    assert.equal(
      (await run("--from-block", "100", "--to-block", "100")).code,
      1
    );
    const tx = await prisma!.transaction.findUniqueOrThrow({
      where: { hash: hashes[0] },
    });
    assert.equal(tx.gasUsed, null);
    assert.equal(tx.input, null);
    assert.equal(
      (
        await prisma!.block.findUniqueOrThrow({
          where: { hash: blockHashes[0] },
        })
      ).baseFeePerGas,
      null
    );
  }
);

test("CLI retries transient RPC failures", { skip: !enabled }, async () => {
  transientFailures = 2;
  const result = await run("--from-block", "100", "--to-block", "100");
  assert.equal(result.code, 0, result.stderr);
  assert.equal(requests, 5);
  assert.equal(
    (
      await prisma!.transaction.findUniqueOrThrow({
        where: { hash: hashes[0] },
      })
    ).gasUsed?.toString(),
    "21000"
  );
});

test(
  "CLI fills missing status when fee data is complete",
  { skip: !enabled },
  async () => {
    assert.equal((await run()).code, 0);
    await prisma!.transaction.update({
      where: { hash: hashes[1] },
      data: { executionStatus: null },
    });
    requests = 0;
    assert.equal((await run()).code, 0);
    assert.equal(requests, 3);
    assert.equal(
      (
        await prisma!.transaction.findUniqueOrThrow({
          where: { hash: hashes[1] },
        })
      ).executionStatus,
      "SUCCESS"
    );
  }
);
