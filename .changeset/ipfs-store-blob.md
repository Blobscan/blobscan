---
"@blobscan/blob-storage-manager": minor
"@blobscan/blob-propagator": minor
"@blobscan/rest-api-server": minor
"@blobscan/api": minor
"@blobscan/web": minor
"@blobscan/docs": minor
---

Implement `IpfsStorage.storeBlob` via the blobscan-ipld push endpoint

`IpfsStorage` can now write blobs (previously read-only): `_storeBlob`
POSTs the blob plus its beacon/execution context to the node's
`POST /blob` endpoint and persists the returned `data_cid` as the
reference. To carry the extra fields the endpoint requires (commitment,
tx hash, blob index, slot, epoch, block number, block hash), a new
optional `BlobContext` is threaded through `BlobStorage.storeBlob`,
`BlobStorageManager`, the propagator's `BlobPropagationInput`, and the
indexer. The context is optional at the storage interface so other
backends are unaffected; `IpfsStorage` asserts its presence at runtime.
`finalize` is always sent as `false` since epoch completeness can't be
known per blob.

IPFS can now be selected as `PRIMARY_BLOB_STORAGE` (it was previously
rejected as write-incapable). The write endpoint lives at a different
base URL than the read gateway, so a new `IPFS_STORAGE_API_URL` env var
configures it; it's passed to `IpfsStorage` as a dedicated `apiUrl` and
is required when IPFS is the primary storage.
