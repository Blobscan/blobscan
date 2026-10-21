---
"@blobscan/db": patch
"@blobscan/api": patch
---

Fixed re-indexing a blob overwriting its KZG proof with the point at infinity. Since Fulu, beacon nodes return that value in place of the proof of a blob they rebuilt from PeerDAS data; the upsert now keeps the stored proof when the incoming one is that placeholder.
