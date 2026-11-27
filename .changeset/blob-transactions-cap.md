---
"@blobscan/api": minor
"@blobscan/web": minor
---

Added `transactionsLimit` (at most 1000) and `transactionsOffset` to `blob.getByBlobId` (`GET /blobs/{id}`), and `transactionCount` (all the transactions of the blob) to its response. Without a limit every transaction is returned, as before. The blob page now loads the newest 100 transactions of a blob and the others on request: a blob in 38,624 transactions made a 54 MB response. The ETH/USD prices of a blob's transactions are now matched by minute, so a transaction without a price no longer shifts the prices of the later transactions, and a blob found by KZG commitment gets its prices too.
