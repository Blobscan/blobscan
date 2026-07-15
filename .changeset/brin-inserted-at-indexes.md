---
"@blobscan/db": patch
---

Convert the `inserted_at` B-tree indexes to BRIN

The `inserted_at` indexes on `address`, `blob`, `block`, and `transaction`
are not used by any application query and `inserted_at` is nearly
monotonically increasing on these append-mostly tables, which is the ideal
BRIN case: the index shrinks from one entry per row to one min/max summary
per block range, with near-zero write overhead, while still supporting
ad-hoc time-range queries.
