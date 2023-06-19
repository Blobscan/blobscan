import { prisma, statsAggregator } from "@blobscan/db";

async function main() {
  const [
    blobOverallStatsInserted,
    blockOverallStatsInserted,
    txOverallStatsInserted,
  ] = await statsAggregator.executeAllOverallStatsQueries();

  console.log(`Total Blob overall stats inserted: ${blobOverallStatsInserted}`);
  console.log(
    `Total Block overall stats inserted: ${blockOverallStatsInserted}`,
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
