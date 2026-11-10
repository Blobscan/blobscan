---
"@blobscan/api": minor
---

Add the `address` router with `getOverall` and `getTimeseries`, which return the metrics of an address as sender and as receiver. `getOverall` also returns the category of the address, its longest streak and its longest gap, and `getTimeseries` returns the self-sends and their blobs. Add an `address` filter to `tx.getAll` that returns the transactions where the address is the sender or the receiver.
