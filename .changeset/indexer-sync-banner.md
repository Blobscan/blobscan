---
"@blobscan/web": minor
---

Showed a banner on all pages when the indexer is behind the chain. The banner shows how far behind the indexer is, and it goes away when the indexer is in sync again. The banner shows when the indexer is more than 5 minutes behind. The app state now updates each 5 minutes and when the page gets focus again.

On networks without a chain config, for example devnet, `useChain()` now returns `undefined` and does not throw an error.
