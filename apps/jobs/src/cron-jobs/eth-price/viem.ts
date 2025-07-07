import type { PublicClient } from "viem";
import { createPublicClient, http } from "viem";
import * as chains from "viem/chains";

import { env } from "../../env";

const chain = Object.values(chains).find(
  (c) => c.id === env.ETH_PRICE_SYNCER_CHAIN_ID
);

if (!chain) {
  throw new Error(
    `Failed to initialize eth usd price feed: chain with id ${env.ETH_PRICE_SYNCER_CHAIN_ID} not found`
  );
}

export const client = createPublicClient({
  chain,
  transport: http(env.ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL),
}) as PublicClient;
