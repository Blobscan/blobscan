import * as chains from "viem/chains";

import { PriceFeed } from "@blobscan/price-feed";

import { env } from "../../env";
import { client } from "./viem";

let priceFeed: PriceFeed | undefined;

export async function getEthUsdPriceFeed() {
  if (!priceFeed) {
    const chain = Object.values(chains).find(
      (c) => c.id === env.ETH_PRICE_SYNCER_CHAIN_ID
    );

    if (!chain) {
      throw new Error(
        `Can't initialize ETH price syncer: chain with id ${env.ETH_PRICE_SYNCER_CHAIN_ID} not found`
      );
    }

    priceFeed = await PriceFeed.create({
      client,
      dataFeedContractAddress:
        env.ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS as `0x${string}`,
      timeTolerance: env.ETH_PRICE_SYNCER_TIME_TOLERANCE,
    });
  }

  return priceFeed;
}
