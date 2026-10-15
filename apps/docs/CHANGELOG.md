# @blobscan/docs

## 0.3.0

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

## 0.2.0

### Minor Changes

- [#985](https://github.com/Blobscan/blobscan/pull/985) [`8c1375d`](https://github.com/Blobscan/blobscan/commit/8c1375d7230cf4ca47ef4b37237c21d748d84264) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Add IPFS storage provider backed by blobscan-ipld

  Add a read-only IpfsStorage backend that retrieves blobs from a
  configurable IPFS gateway. CID references are registered externally
  via a new POST /blobs/ipfs-references endpoint,
  following the same pattern as the existing WeaveVM integration.
  Introduces a dedicated `ipfs` service auth role and
  IPFS_STORAGE_ENABLED / IPFS_STORAGE_GATEWAY_URL / IPFS_STORAGE_API_KEY /
  IPFS_API_KEY env vars.

## 0.1.2

### Patch Changes

- [#981](https://github.com/Blobscan/blobscan/pull/981) [`904831c`](https://github.com/Blobscan/blobscan/commit/904831cc5f3507fc1488a16ff952469281654500) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Add support for Google Cloud Storage signed URLs in blob API responses. When `GOOGLE_STORAGE_SIGNED_URLS_ENABLED` is set to `true`, the API returns time-limited signed URLs (1 hour) instead of public URLs for blobs stored in GCS, allowing private buckets to be used without exposing objects publicly. Defaults to `false`.

  **Heads-up — production rollout:** Blobscan-hosted instances will enable this flag in production to reduce egress costs from public-bucket traffic. Self-hosted operators relying on stable public URLs (e.g. external caches, third-party integrations) should keep `GOOGLE_STORAGE_SIGNED_URLS_ENABLED=false` and be aware that signed URLs expire after 1 hour.

  **Required permission:** the service account must have `roles/storage.objectViewer` (or equivalent signing permission) on the bucket. Without it, signing fails per request and the API logs an error and falls back to the original URL.

## 0.1.1

### Patch Changes

- [#975](https://github.com/Blobscan/blobscan/pull/975) [`5266dd8`](https://github.com/Blobscan/blobscan/commit/5266dd80b17e2af25120f5d0aaf06a685bee6345) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Update funding page

## 0.1.0

### Minor Changes

- [#425](https://github.com/Blobscan/blobscan/pull/425) [`1cfb587`](https://github.com/Blobscan/blobscan/commit/1cfb587cf60503f202684f8fd30eddeb9179e48c) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added sections with tutorials for running blobscan with kurtosis, kind and locally

## 0.0.3

### Patch Changes

- [#279](https://github.com/Blobscan/blobscan/pull/279) [`105e813`](https://github.com/Blobscan/blobscan/commit/105e8134660b8208f148a0482e6a4ecf41dee833) Thanks [@PJColombo](https://github.com/PJColombo)! - Renamed network name env var

## 0.0.2

### Patch Changes

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset
