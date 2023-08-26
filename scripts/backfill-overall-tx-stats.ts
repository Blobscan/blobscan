import { prisma } from "@blobscan/db";

async function main() {
  const res = await prisma.transactionOverallStats.backfill();

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
