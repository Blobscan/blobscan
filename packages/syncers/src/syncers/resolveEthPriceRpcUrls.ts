import { ETH_USD_PRICE_FEEDS, findEthUsdPriceFeed } from "@blobscan/price-feed";

/** The chain of the deprecated vars when ETH_PRICE_SYNCER_CHAIN_ID is not set. */
export const LEGACY_ETH_PRICE_CHAIN_ID = 137;

export interface EthPriceRpcUrlsConfig {
  /** The value of ETH_PRICE_SYNCER_RPC_URLS. */
  rpcUrls?: Record<number, string>;
  /** The value of the deprecated ETH_PRICE_SYNCER_CHAIN_ID. */
  legacyChainId?: number;
  /** The value of the deprecated ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL. */
  legacyRpcUrl?: string;
}

export interface ResolvedEthPriceRpcUrls {
  rpcUrls: Record<number, string>;
  warnings: string[];
}

/**
 * Merges ETH_PRICE_SYNCER_RPC_URLS with the deprecated
 * ETH_PRICE_SYNCER_CHAIN_ID and ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL.
 *
 * - ETH_PRICE_SYNCER_RPC_URLS wins when both give a URL for the same chain.
 * - A chain in ETH_PRICE_SYNCER_RPC_URLS that has no ETH/USD feed is a config
 *   error, so this function throws.
 * - A legacy chain that has no ETH/USD feed gives a warning, and the function
 *   ignores it. Old configs with such a chain must not stop the server.
 */
export function resolveEthPriceRpcUrls({
  rpcUrls = {},
  legacyChainId,
  legacyRpcUrl,
}: EthPriceRpcUrlsConfig): ResolvedEthPriceRpcUrls {
  const unknownChainIds = Object.keys(rpcUrls)
    .map(Number)
    .filter((chainId) => !findEthUsdPriceFeed(chainId));

  if (unknownChainIds.length) {
    throw new Error(
      `Invalid ETH_PRICE_SYNCER_RPC_URLS: no ETH/USD price feed for chain(s) ${unknownChainIds.join(
        ", "
      )}. Supported chains: ${ETH_USD_PRICE_FEEDS.map(
        ({ chain }) => chain.id
      ).join(", ")}`
    );
  }

  const resolvedRpcUrls: Record<number, string> = { ...rpcUrls };
  const warnings: string[] = [];

  if (legacyRpcUrl) {
    const chainId = legacyChainId ?? LEGACY_ETH_PRICE_CHAIN_ID;

    if (!findEthUsdPriceFeed(chainId)) {
      warnings.push(
        `ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL is ignored: no ETH/USD price feed for chain ${chainId}. Use ETH_PRICE_SYNCER_RPC_URLS with a supported chain.`
      );
    } else if (!resolvedRpcUrls[chainId]) {
      resolvedRpcUrls[chainId] = legacyRpcUrl;
    }
  }

  return { rpcUrls: resolvedRpcUrls, warnings };
}
