# @blobscan/env

## 0.4.0

### Minor Changes

- [#998](https://github.com/Blobscan/blobscan/pull/998) [`74b33ba`](https://github.com/Blobscan/blobscan/commit/74b33ba464a10b31127a1f395ff67ee585e2e70a) Thanks [@PJColombo](https://github.com/PJColombo)! - Implement `IpfsStorage.storeBlob` via the blobscan-ipld push endpoint

  `IpfsStorage` can now write blobs (previously read-only): `_storeBlob`
  POSTs the blob plus its beacon/execution context to the blobscan-ipld
  service's `POST /blob` endpoint and persists the returned `data_cid` as the
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
  base URL than the read gateway, so a new `IPFS_STORAGE_IPLD_URL` env var
  configures it; it's passed to `IpfsStorage` as a dedicated `ipldUrl` and
  is required when IPFS is the primary storage.

  `IpfsStorage`'s health check now targets the blobscan-ipld service's
  `/readyz` endpoint when a write URL (`ipldUrl`) is configured, since that
  service owns the kubo client and the write path; read-only deployments
  (gateway only) still probe the IPFS gateway directly.

## 0.3.0

### Minor Changes

- [#981](https://github.com/Blobscan/blobscan/pull/981) [`904831c`](https://github.com/Blobscan/blobscan/commit/904831cc5f3507fc1488a16ff952469281654500) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Add support for Google Cloud Storage signed URLs in blob API responses. When `GOOGLE_STORAGE_SIGNED_URLS_ENABLED` is set to `true`, the API returns time-limited signed URLs (1 hour) instead of public URLs for blobs stored in GCS, allowing private buckets to be used without exposing objects publicly. Defaults to `false`.

  **Heads-up — production rollout:** Blobscan-hosted instances will enable this flag in production to reduce egress costs from public-bucket traffic. Self-hosted operators relying on stable public URLs (e.g. external caches, third-party integrations) should keep `GOOGLE_STORAGE_SIGNED_URLS_ENABLED=false` and be aware that signed URLs expire after 1 hour.

  **Required permission:** the service account must have `roles/storage.objectViewer` (or equivalent signing permission) on the bucket. Without it, signing fails per request and the API logs an error and falls back to the original URL.

## 0.2.0

### Minor Changes

- [#833](https://github.com/Blobscan/blobscan/pull/833) [`52b89d6`](https://github.com/Blobscan/blobscan/commit/52b89d6a90200eea5647c49bb5fba8c0b0ff1529) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for configurating blob retention mode on blob propagator

## 0.1.0

### Minor Changes

- [#681](https://github.com/Blobscan/blobscan/pull/681) [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256) Thanks [@PJColombo](https://github.com/PJColombo)! - Added Weavevm blob storage support
