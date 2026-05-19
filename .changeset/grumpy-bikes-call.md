---
"@blobscan/blob-storage-manager": minor
"@blobscan/rest-api-server": minor
"@blobscan/api": minor
"@blobscan/db": minor
"@blobscan/docs": minor
"@blobscan/web": minor
---

Add IPFS storage provider backed by blobscan-ipld

Add a read-only IpfsStorage backend that retrieves blobs from a
configurable IPFS gateway. CID references are registered externally
via a new POST /blobs/ipfs-references endpoint,
following the same pattern as the existing WeaveVM integration.
Introduces a dedicated `ipfs` service auth role and
IPFS_STORAGE_ENABLED / IPFS_STORAGE_GATEWAY_URL / IPFS_STORAGE_API_KEY env vars.
