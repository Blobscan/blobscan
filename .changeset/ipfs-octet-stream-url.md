---
"@blobscan/db": patch
"@blobscan/web": patch
---

Fix IPFS blobs that the gateway serves as images.

- Add `?filename=<cid>.bin` to the IPFS blob URL. The gateway then serves the blob as `application/octet-stream`. Before, the gateway used the first bytes of the blob to find its type, and blobs that start with `00 00 01 00` or `00 00 02 00` were served as `image/x-icon`.
- The `/api/blob-data` proxy now reads IPFS data as binary for all Content-Types. Before, it returned an error when the gateway sent a type other than `application/octet-stream`.
