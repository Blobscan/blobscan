import { prisma } from "@blobscan/db";

async function main() {
  const [
    blobOverallStatsInserted,
    blockOverallStatsInserted,
    txOverallStatsInserted,
  ] = await Promise.all([
    prisma.blobOverallStats.backfill(),
    prisma.blockOverallStats.backfill(),
    prisma.transactionOverallStats.backfill(),
  ]);

  console.log(`Total Blob overall stats inserted: ${blobOverallStatsInserted}`);
  console.log(
    `Total Block overall stats inserted: ${blockOverallStatsInserted}`
  );
  console.log(`Total tx overall stats inserted: ${txOverallStatsInserted}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
