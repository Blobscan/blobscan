---
"@blobscan/api": patch
"@blobscan/web": patch
---

Fixed the slow sender transaction navigation queries that filled the database connection pool. `tx.getAdjacentsByAddress` now takes the transaction hash and gets the previous and next transactions with one SQL query that uses the `(from_id, block_timestamp, index)` index. The transaction page starts this request at the same time as the transaction request.
