---
"@blobscan/web": minor
---

Showed a banner on all pages when the indexer is behind the chain. The banner shows how far behind the indexer is, and it goes away when the indexer is in sync again. Set `PUBLIC_INDEXER_LAG_THRESHOLD_MINUTES` to change the lag that shows the banner (default: 5 minutes). The app state now updates each 5 minutes and when the page gets focus again.

On networks without a chain config, for example devnet, `useChain()` now returns `undefined` and does not throw an error.
