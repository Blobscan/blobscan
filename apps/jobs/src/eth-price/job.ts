import { ethUsdPriceFeed } from "@blobscan/price-feed";

import { createRedis } from "../shared/redis";
import { EthPriceCronJob } from "./EthPriceCronJob";

async function main() {
  const redis = createRedis(e);
  const syncer = new EthPriceCronJob({
    redisUriOrConnection: redis,
    cronPattern: "0 * * * *", // hourly
    ethUsdPriceFeed,
  });

  await syncer.start();
}

main().catch((err) => {
  console.error("Fatal error running ETHPriceSyncer:", err);
  process.exit(1);
});
