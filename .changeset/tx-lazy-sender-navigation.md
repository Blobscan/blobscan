---
"@blobscan/api": minor
"@blobscan/web": patch
---

The transaction page now gets the previous or next transaction of the sender only when the user clicks an arrow. The new `tx.getSenderAdjacentTx` procedure returns the full adjacent transaction in the format of `tx.getByHash`, so a click sends only one request. When the sender has no transaction in that direction, the page stays on the same transaction and disables the arrow.

**Breaking change:** The `tx.getSenderAdjacentsByHash` procedure has the new name `tx.getSenderAdjacentTx`. Its input is now the transaction `hash`, a `direction` (`"prev"` or `"next"`) and the `expand` of `tx.getByHash`. It returns the adjacent transaction in the format of `tx.getByHash`, or `null` when there is no transaction in that direction. It does not return `{ prevTxHash, nextTxHash }`.
