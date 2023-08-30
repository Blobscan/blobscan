import { fixtures } from "../fixtures/index";
import { getPrisma, getStorage } from "./services";

export default async () => {
  const prisma = getPrisma();
  const storage = getStorage();

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

  await storage.createBucket("blobscan-test");

  await Promise.all([
    storage
      .bucket("blobscan-test")
      .file("1/ob/Ha/sh/obHash001.txt")
      .save("1234abcdefg123"),
    storage
      .bucket("blobscan-test")
      .file("1/ob/Ha/sh/obHash002.txt")
      .save("1234abcdefg123456"),
    storage
      .bucket("blobscan-test")
      .file("1/ob/Ha/sh/obHash003.txt")
      .save("1234abcdefg123456789ab"),
    storage
      .bucket("blobscan-test")
      .file("1/ob/Ha/sh/obHash004.txt")
      .save("0xd76df869b71d79f835db7e39ebbf3d69b71d7e"),
  ]);
};
