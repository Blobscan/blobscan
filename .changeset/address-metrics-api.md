---
"@blobscan/api": minor
---

Add the `address` router with `getOverall` and `getTimeseries`, which return the metrics of an address as sender and as receiver. Add an `address` filter to `tx.getAll` that returns the transactions where the address is the sender or the receiver.
