---
"@blobscan/api": minor
"@blobscan/dagster": minor
"@blobscan/db": minor
"@blobscan/web": minor
---

Added the `maxEthPrice`, `minEthPrice` and `avgEthPrice` metrics. Dagster calculates them from the ETH/USD prices for each period, and the stats endpoints return them in the global dimension. The stats page shows them in a new ETH Price chart.
