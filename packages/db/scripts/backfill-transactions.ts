import { PrismaClient } from "@prisma/client";
import { parseArgs } from "node:util";

import { backfillTransactions } from "./backfill";
import { createRpc } from "./transaction-rpc";

async function main() {
  const { values } = parseArgs({
    options: {
      "rpc-url": { type: "string" },
      "from-block": { type: "string" },
      "to-block": { type: "string" },
      "batch-size": { type: "string", default: "100" },
      "block-range-size": { type: "string", default: "100" },
      "rpc-batch-size": { type: "string", default: "20" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });
  if (values.help) {
    console.log(`Backfill execution fees and calldata for stored transactions.

pnpm --filter @blobscan/db backfill:transactions --rpc-url <url>

Options:
  --rpc-url <url>      HTTP RPC URL (or EXECUTION_RPC_URL)
  --from-block <n>     First block, inclusive
  --to-block <n>       Last block, inclusive
  --batch-size <n>     Transactions per processing/write batch (default: 100)
  --block-range-size <n> Blocks per database read (default: 100; maximum: 10000)
  --rpc-batch-size <n> RPC calls per HTTP request (default: 20; maximum: 100)
  --dry-run           Read and validate RPC data without database writes

Requires DATABASE_URL. Apply database migrations first.
Completed records are skipped. Run the command again to resume.`);
    return;
  }
  const rpcUrl = values["rpc-url"] ?? process.env.EXECUTION_RPC_URL;
  if (!rpcUrl) throw new Error("Set --rpc-url or EXECUTION_RPC_URL");
  if (!/^https?:$/.test(new URL(rpcUrl).protocol))
    throw new Error("Use an HTTP RPC URL");
  const parseNumber = (value: string | undefined) => {
    if (value === undefined) return undefined;
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      throw new Error(
        "Block numbers and batch size must be non-negative integers"
      );
    }
    return Number(value);
  };
  const from = parseNumber(values["from-block"]);
  const to = parseNumber(values["to-block"]);
  const batchSize = parseNumber(values["batch-size"])!;
  if (batchSize < 1 || batchSize > 1000)
    throw new Error("Batch size must be between 1 and 1000");
  if (from !== undefined && to !== undefined && from > to)
    throw new Error("Invalid block range");
  const blockRangeSize = parseNumber(values["block-range-size"])!;
  if (blockRangeSize < 1 || blockRangeSize > 10000)
    throw new Error("Block range size must be between 1 and 10000");
  const rpcBatchSize = parseNumber(values["rpc-batch-size"])!;
  if (rpcBatchSize < 1 || rpcBatchSize > 100)
    throw new Error("RPC batch size must be between 1 and 100");
  const rpc = createRpc(rpcUrl, 5, rpcBatchSize);
  const prisma = new PrismaClient();
  await backfillTransactions({
    prisma,
    rpc,
    from,
    to,
    batchSize,
    blockRangeSize,
    dryRun: values["dry-run"],
  });
}

main().catch(() => {
  console.error(
    "Backfill failed. Check the options, RPC access, database connection, and migrations."
  );
  process.exitCode = 1;
});
