---
"@blobscan/db": patch
---

Add `?filename=<cid>.bin` to the IPFS blob URL. The gateway then serves the blob as `application/octet-stream`. Before, the gateway used the first bytes of the blob to find its type, and blobs that start with `00 00 01 00` or `00 00 02 00` were served as `image/x-icon`.
