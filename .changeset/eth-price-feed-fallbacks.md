---
"@blobscan/price-feed": minor
"@blobscan/syncers": minor
"@blobscan/env": minor
"@blobscan/db": minor
"@blobscan/rest-api-server": minor
---

Add fallback price feeds to the ETH price syncer. The syncer reads the Chainlink ETH/USD feeds in this order: Polygon, Ethereum, Arbitrum and Optimism. It goes to the next feed when a feed has no round in the time tolerance or when its RPC fails. It uses only the chains that have an RPC URL in the new `ETH_PRICE_SYNCER_RPC_URLS` env var (format: `<chainId>=<url>,<chainId>=<url>`). When all the feeds fail, the syncer logs an error and writes no price.

Each feed now has its own maximum staleness (its heartbeat plus 60 seconds). `ETH_PRICE_SYNCER_TIME_TOLERANCE` replaces it for all the feeds when it is set. Before, the default tolerance had no limit.

`PriceFeed` now throws RPC errors. Before, it returned `null` for them.

Add the `price_feed` table and these audit columns to `eth_usd_price`: `round_id`, `round_timestamp`, `price_feed_id`, `created_at` and `updated_at`. The existing rows have NULL values in the new columns.

To upgrade, replace `ETH_PRICE_SYNCER_CHAIN_ID` and `ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL` with `ETH_PRICE_SYNCER_RPC_URLS` (for example `137=https://polygon-rpc.example`). The old vars still work, with a warning. `ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS` has no effect now.
