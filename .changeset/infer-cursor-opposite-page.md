---
"@blobscan/api": patch
"@blobscan/docs": patch
---

Removed the extra page-existence query from cursor pagination for blobs, blocks, and transactions. Inferred the opposite page from the cursor direction and kept empty-page recovery cursors, so navigation requires one page lookup instead of two.
