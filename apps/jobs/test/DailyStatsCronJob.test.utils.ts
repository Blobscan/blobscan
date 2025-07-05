import { prisma } from "@blobscan/db";
import type { Prisma } from "@blobscan/db";

import { formatDate } from "../src/utils";

export async function getDailyStatsDates() {
  const dailyStats = await prisma.dailyStats.findMany({
    orderBy: [{ day: "asc" }, { category: "asc" }, { rollup: "asc" }],
  });

  return dailyStats.map(({ day, category, rollup }) => [
    formatDate(day),
    category,
    rollup,
  ]);
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
