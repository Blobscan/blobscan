---
"@blobscan/db": patch
---

Drop three redundant database indexes

`transaction(from_id, block_timestamp)` is a strict prefix of
`transaction(from_id, block_timestamp, index)`,
`blobs_on_transactions(tx_hash)` is a prefix of both the primary key
`(tx_hash, index)` and `(tx_hash, blob_hash)`, and
`address(address, rollup)` leads with the primary-key column. Every query
they served is served identically by the longer index or primary key, so
they only added write and storage overhead on the largest tables.
