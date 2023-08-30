import { getPrisma, getStorage } from "./services";

export default async () => {
  const prisma = getPrisma();
  const storage = getStorage();

  await prisma.$transaction([
    prisma.blockchainSyncState.deleteMany(),
    prisma.blobDailyStats.deleteMany(),
    prisma.blockDailyStats.deleteMany(),
    prisma.transactionDailyStats.deleteMany(),
    prisma.blobOverallStats.deleteMany(),
    prisma.blockOverallStats.deleteMany(),
    prisma.transactionOverallStats.deleteMany(),
    prisma.blobData.deleteMany(),
    prisma.blobsOnTransactions.deleteMany(),
    prisma.blobDataStorageReference.deleteMany(),
    prisma.blob.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.address.deleteMany(),
    prisma.block.deleteMany(),
  ]);

  const [buckets] = await storage.getBuckets();

  if (buckets.length > 0) {
    await storage.bucket("blobscan-test").deleteFiles();
    await storage.bucket("blobscan-test").delete();
  }
};
