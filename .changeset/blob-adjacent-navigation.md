---
"@blobscan/api": minor
"@blobscan/web": minor
---

Added previous/next navigation to the blob details page. The arrows move to the adjacent blob in the same transaction. After the last blob of a transaction, the next arrow moves to the first blob of the next transaction of the same sender. Before the first blob, the previous arrow moves to the last blob of the previous transaction of the sender.

The new `blob.getAdjacentBlob` procedure returns the previous or the next blob of a blob position, in the format of `blob.getByBlobId`. The page sends it only when the user clicks an arrow, and puts the blob in the cache of the next page.
