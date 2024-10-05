import { prisma } from "@blobscan/db";
import type { Prisma } from "@blobscan/db";

import { formatDate } from "../src/utils";

export async function getAllDailyStatsDates() {
  const [blobDailyStats, blockDailyStats, txDailyStats] = await Promise.all([
    prisma.blobDailyStats.findMany({
      orderBy: [{ day: "asc" }, { category: "asc" }, { rollup: "asc" }],
    }),
    prisma.blockDailyStats.findMany({
      orderBy: [{ day: "asc" }],
    }),
    prisma.transactionDailyStats.findMany({
      orderBy: [{ day: "asc" }, { category: "asc" }, { rollup: "asc" }],
    }),
  ]);

  return {
    blobDailyStats: blobDailyStats.map(({ day, category, rollup }) => [
      formatDate(day),
      category,
      rollup,
    ]),
    blockDailyStats: blockDailyStats.map(({ day }) => formatDate(day)),
    txDailyStats: txDailyStats.map(({ day, category, rollup }) => [
      formatDate(day),
      category,
      rollup,
    ]),
  };
}

export function indexNewBlock({
  blobsOnTransactions,
  block,
  txs,
}: {
  blobsOnTransactions: Prisma.BlobsOnTransactionsCreateManyInput[];
  block: Prisma.BlockCreateInput;
  txs: Prisma.TransactionCreateManyInput[];
}) {
  return prisma.$transaction([
    prisma.block.create({ data: block }),
    prisma.transaction.createMany({ data: txs }),
    prisma.blobsOnTransactions.createMany({ data: blobsOnTransactions }),
  ]);
}
