---
"@blobscan/api": major
"@blobscan/rest-api-server": minor
"@blobscan/web": minor
"@blobscan/docs": patch
---

Bounded the transactions returned for a blob (a blob in 38,624 transactions made a 54 MB response) and moved the cursor-paginated routes to `/v2`.

- **Breaking:** renamed `/v1/blocks`, `/v1/blobs` and `/v1/transactions` to `/v2/...`. The `/v2` routes are tagged `beta` in the OpenAPI document, so that they are grouped together in the Swagger UI.
- Added `GET /v2/blobs/{id}` (`blob.getByBlobIdV2`): the blob with `transactionCount` (transactions in canonical blocks) and no transaction list.
- Added `GET /v2/blobs/{id}/transactions` (`blob.getTransactionsByBlobId`): the transactions of a blob with cursor pagination (`ps`, `cursor`, `count`, `sort`, `type`, `expand`). The rows do not repeat the blob.
- **Breaking:** `GET /blobs/{id}` (`blob.getByBlobId`) returns at most `transactionsLimit` transactions (default 100, maximum 1000), newest first, and adds `transactionCount` with the total.
- `blob.getAdjacentBlob` returns the blob in the `getByBlobIdV2` format.
- The ETH/USD prices of a blob's transactions are matched by minute: a transaction without a price no longer shifts the prices of the later transactions, and a blob found by KZG commitment gets its prices too.
- The blob page gets the blob from `getByBlobIdV2` and lists its transactions from `getTransactionsByBlobId`, 100 at a time, with the total.
