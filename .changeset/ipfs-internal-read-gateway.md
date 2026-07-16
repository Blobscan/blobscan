---
"@blobscan/blob-storage-manager": patch
"@blobscan/env": patch
"@blobscan/web": patch
"@blobscan/rest-api-server": patch
---

Add optional `IPFS_STORAGE_INTERNAL_GATEWAY_URL` so IPFS-backed blob reads can use an internal gateway address separate from the public `IPFS_STORAGE_GATEWAY_URL` used to build user-facing blob links. Without this, deployments where the public gateway URL points back at the service's own public domain caused every IPFS-backed blob read to round-trip out to the internet and back to fetch its own data.
