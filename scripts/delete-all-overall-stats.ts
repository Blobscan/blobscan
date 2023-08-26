import { prisma } from "@blobscan/db";

const OVERALL_STATS_DELETE = {
  where: {
    id: 1,
  },
};

async function main() {
  await Promise.all([
    prisma.blobOverallStats.delete(OVERALL_STATS_DELETE),
    prisma.blockOverallStats.delete(OVERALL_STATS_DELETE),
    prisma.transactionOverallStats.delete(OVERALL_STATS_DELETE),
    prisma.blockchainSyncState.update({
      data: {
        lastFinalizedBlock: 0,
      },
      where: {
        id: 1,
      },
    }),
  ]);

  console.log("All overall stats removed");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
