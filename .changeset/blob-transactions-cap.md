---
"@blobscan/api": major
"@blobscan/web": minor
---

Bounded the transactions returned for a blob. A blob in 38,624 transactions made a 54 MB response.

- Added `GET /v1/blobs/{id}` (`blob.getByBlobIdV1`): the blob with `transactionCount` (transactions in canonical blocks) and no transaction list.
- Added the `blob` filter (versioned hash) to `GET /v1/blobs` (`blob.getAllByCursor`), to page through the transactions of a blob with cursor pagination; `count=true` returns their total.
- **Breaking:** `GET /blobs/{id}` (`blob.getByBlobId`) returns at most `transactionsLimit` transactions (default 100, maximum 1000), newest first, and adds `transactionCount` with the total. Use `GET /v1/blobs?blob=<versioned hash>` for the others.
- `blob.getAdjacentBlob` returns the blob in the `getByBlobIdV1` format.
- The ETH/USD prices of a blob's transactions are matched by minute: a transaction without a price no longer shifts the prices of the later transactions, and a blob found by KZG commitment gets its prices too.
- The blob page gets the blob from `getByBlobIdV1` and lists its transactions 100 at a time, with the total.
