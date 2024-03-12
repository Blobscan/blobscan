import { expect } from "vitest";

import { prisma } from "@blobscan/db";
import type { Prisma } from "@blobscan/db";

import { formatDate } from "../src/utils";

function sortAsc(a: string, b: string) {
  return a < b ? -1 : 1;
}

export async function getAllDailyStatsDates() {
  const allDailyStats = await Promise.all([
    prisma.blobDailyStats.findMany(),
    prisma.blockDailyStats.findMany(),
    prisma.transactionDailyStats.findMany(),
  ]);

  const [
    blobDailyStatsDates,
    blockDailyStatsDates,
    transactionDailyStatsDates,
  ] = allDailyStats.map((dailyStats) =>
    dailyStats.map((stats) => formatDate(stats.day))
  );

  return {
    blobDailyStatsDates,
    blockDailyStatsDates,
    transactionDailyStatsDates,
  };
}

export function expectDailyStatsDatesToBeEqual(
  allDailyStats: {
    blobDailyStatsDates?: string[];
    blockDailyStatsDates?: string[];
    transactionDailyStatsDates?: string[];
  },
  expectedDates: string[]
) {
  const sortedExpectedDates = expectedDates.sort(sortAsc);

  const sortedBlobDailyStatsDates =
    allDailyStats.blobDailyStatsDates?.sort(sortAsc) ?? [];
  const sortedBlockDailyStatsDates =
    allDailyStats.blockDailyStatsDates?.sort(sortAsc) ?? [];
  const sortedTransactionDailyStatsDates =
    allDailyStats.transactionDailyStatsDates?.sort(sortAsc) ?? [];

  expect(sortedBlobDailyStatsDates, "Blob daily stats mismatch").toEqual(
    sortedExpectedDates
  );
  expect(sortedBlockDailyStatsDates, "Block daily stats mismatch").toEqual(
    sortedExpectedDates
  );
  expect(
    sortedTransactionDailyStatsDates,
    "Transaction daily stats mismatch"
  ).toEqual(sortedExpectedDates);
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
