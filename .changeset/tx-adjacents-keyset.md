---
"@blobscan/api": minor
"@blobscan/web": patch
---

Fixed the slow sender transaction navigation queries that filled the database connection pool. One SQL query now gets the previous and next transactions of the sender with the `(from_id, block_timestamp, index)` index. The transaction page starts this request at the same time as the transaction request.

**Breaking change:** The `tx.getAdjacentsByAddress` procedure has the new name `tx.getSenderAdjacentsByHash`. Its input is now only the transaction `hash`, not `senderAddress`, `blockTimestamp` and `txIndex`. For an unknown hash, it now throws a `NOT_FOUND` error.
