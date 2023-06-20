import dayjs from "@blobscan/dayjs";
import { prisma, statsAggregator } from "@blobscan/db";

async function main() {
  const yesterday = dayjs().subtract(1, "day").endOf("date");

  const res = await statsAggregator.blob.backfillBlobDailyAggregates({
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
