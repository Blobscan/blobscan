import type { Address, Chain } from "viem";
import { arbitrum, mainnet, optimism, polygon } from "viem/chains";

export interface PriceFeedDefinition {
  chain: Chain;
  address: Address;
  /**
   * The maximum time in seconds between two feed updates, as Chainlink
   * publishes it.
   */
  heartbeat: number;
}

/**
 * The extra time in seconds that we accept after the heartbeat. It covers
 * block and RPC delays.
 */
export const STALENESS_MARGIN = 60;

/**
 * The Chainlink ETH/USD feeds, in the order that the ETH price syncer tries
 * them. The values come from the Chainlink reference data directory
 * (https://data.chain.link). Only the standard `eth-usd` feeds are used.
 */
export const ETH_USD_PRICE_FEEDS: readonly PriceFeedDefinition[] = [
  {
    chain: polygon,
    address: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    heartbeat: 27,
  },
  {
    chain: mainnet,
    address: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    heartbeat: 3600,
  },
  {
    chain: arbitrum,
    address: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
    heartbeat: 1755,
  },
  {
    chain: optimism,
    address: "0x13e3Ee699D1909E989722E753853AE30b17e08c5",
    heartbeat: 1200,
  },
];

export function getMaxStaleness({ heartbeat }: PriceFeedDefinition) {
  return heartbeat + STALENESS_MARGIN;
}

export function findEthUsdPriceFeed(chainId: number) {
  return ETH_USD_PRICE_FEEDS.find((feed) => feed.chain.id === chainId);
}
