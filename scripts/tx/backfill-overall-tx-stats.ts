import { prisma, statsAggregator } from "@blobscan/db";

async function main() {
  const res = await statsAggregator.tx.executeOverallTxStatsQuery();

  console.log(res);
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
