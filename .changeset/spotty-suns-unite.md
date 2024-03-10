---
"@blobscan/api": minor
---

Revamped the reorged slots handling endpoint.

The endpoint now accepts a set of forked slots and marks those that exist in the database as reorganized. This is achieved by transferring the transactions of the corresponding blocks to the fork transactions table.
