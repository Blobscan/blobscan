import { PrismaClient } from "@prisma/client";

import DB_FIXTURES from "./tests/db-fixtures.json";

if (!process.env.DATABASE_URL) {
  throw new Error("No DATABASE_URL defined");
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: [],
});

async function main() {
  await prisma.$transaction([
    prisma.transactionFork.deleteMany(),
    prisma.blobsOnTransactions.deleteMany(),
    prisma.blob.deleteMany(),
    prisma.transactionFork.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.address.deleteMany(),
    prisma.block.deleteMany(),

    prisma.block.createMany({
      data: DB_FIXTURES.blocks,
    }),
    prisma.address.createMany({ data: DB_FIXTURES.addresses as any }),
    prisma.transaction.createMany({ data: DB_FIXTURES.txs }),
    prisma.blob.createMany({ data: DB_FIXTURES.blobs }),
    prisma.blobsOnTransactions.createMany({
      data: DB_FIXTURES.blobsOnTxs,
    }),
    prisma.transactionFork.createMany({
      data: DB_FIXTURES.transactionForks,
    }),
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();
    process.exit(1);
  });
