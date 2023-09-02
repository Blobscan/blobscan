import { fixtures } from "../fixtures/index";
import { getPrisma } from "./services";

export default async () => {
  const prisma = getPrisma();

  await prisma.$transaction([
    prisma.blockchainSyncState.createMany({
      data: fixtures.blockchainSyncState,
    }),
    prisma.block.createMany({ data: fixtures.blocks }),
    prisma.address.createMany({ data: fixtures.addresses }),
    prisma.transaction.createMany({ data: fixtures.txs }),
    prisma.blob.createMany({ data: fixtures.blobs }),
    prisma.blobDataStorageReference.createMany({
      data: fixtures.blobDataStorageRefs,
    }),
    prisma.blobData.createMany({ data: fixtures.blobDatas }),
    prisma.blobsOnTransactions.createMany({
      data: fixtures.blobsOnTransactions,
    }),
  ]);
};
