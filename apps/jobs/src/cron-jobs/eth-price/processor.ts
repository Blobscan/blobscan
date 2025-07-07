import dayjs, { normalizeDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import { getEthUsdPriceFeed } from "./price-feed";
import type { EthPriceJob } from "./types";

export default async (job: EthPriceJob) => {
  const now = normalizeDate(dayjs());

  const targetDateTime = now.startOf(job.data.granularity);

  const ethUsdPriceFeed = await getEthUsdPriceFeed();

  const priceData = await ethUsdPriceFeed.findPriceByTimestamp(
    targetDateTime.unix()
  );

  if (!priceData) {
    return {
      timestamp: targetDateTime.toISOString(),
    };
  }

  const roundId = priceData.roundId.toString();
  const price = priceData.price;
  const priceTimestamp = targetDateTime.toDate();
  const priceRow = {
    price,
    timestamp: priceTimestamp,
  };

  await prisma.ethUsdPrice.upsert({
    create: priceRow,
    update: priceRow,
    where: {
      timestamp: priceTimestamp,
    },
  });

  return {
    price,
    timestamp: targetDateTime.toISOString(),
    roundId,
  };
};
