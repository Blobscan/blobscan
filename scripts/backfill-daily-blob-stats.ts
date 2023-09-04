import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

async function main() {
  const yesterday = dayjs().subtract(1, "day").endOf("date");

  const res = await prisma.blobDailyStats.fill({
    to: yesterday.toISOString(),
  });

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
