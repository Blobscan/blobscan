import { PrismaClient } from "@prisma/client";

import { fixtures } from "../fixtures/index";

const prisma = new PrismaClient();

export default async () => {
  await prisma.$transaction([
    prisma.block.createMany({ data: fixtures.blocks }),
    prisma.address.createMany({ data: fixtures.addresses }),
    prisma.transaction.createMany({ data: fixtures.txs }),
    prisma.blob.createMany({ data: fixtures.blobs }),
    prisma.blobDataStorageReference.createMany({
      data: fixtures.blobDataStorageRefs,
    }),
    prisma.blobsOnTransactions.createMany({
      data: fixtures.blobsOnTransactions,
    }),
  ]);
};
