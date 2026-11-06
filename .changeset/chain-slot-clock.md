---
"@blobscan/chains": minor
---

Added `secondsPerSlot` and `getSlotTimestamp()` to `Chain`. Gnosis uses 5 seconds for each slot, and the other chains use 12 seconds.

Corrected the fork activation data that did not agree with the slot clock: the Sepolia BPO2 activation slot (8,822,784), the mainnet Dencun activation date, and the Hoodi Dencun activation date.
