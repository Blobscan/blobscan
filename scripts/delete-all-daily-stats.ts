import { prisma } from "@blobscan/db";

async function main() {
  await Promise.all([
    prisma.blobDailyStats.deleteAll(),
    prisma.blockDailyStats.deleteAll(),
    prisma.transactionDailyStats.deleteAll(),
  ]);

  console.log("All daily stats removed");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
