# @blobscan/env

## 0.6.0

### Minor Changes

- [#1037](https://github.com/Blobscan/blobscan/pull/1037) [`18bd945`](https://github.com/Blobscan/blobscan/commit/18bd945b22118573de2288c53bd4d08ea4f51376) Thanks [@PJColombo](https://github.com/PJColombo)! - Remove the Swarm stamp job.

  - `SwarmStorage` reads the batch ID from `SWARM_BATCH_ID`. It does not read it from the database.
  - `SWARM_BATCH_ID` is required when `SWARM_STORAGE_ENABLED=true`.
  - Remove the `SWARM_STAMP_CRON_PATTERN` env variable.
  - Remove the `blobStoragesState.getState` procedure and the Swarm fields from the app state.
  - Remove the Swarm blob data expiry indicator from the web app.

### Patch Changes

- [#1035](https://github.com/Blobscan/blobscan/pull/1035) [`1a3b53a`](https://github.com/Blobscan/blobscan/commit/1a3b53a63c9feaa66acc7799e7a2b2f3d435d0dc) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Resolve the remaining dependency advisories.

  - Upgrade Next.js, Zod, ECharts, Turborepo, T3 env, Prisma, and Prisma instrumentation
  - Align Prisma Client and `@prisma/instrumentation` on 6.19.3
  - Move Prisma CLI configuration to `prisma.config.ts` so Prisma 6 resolves the existing migrations directory
  - Override Prisma's `deepmerge-ts` dependency with the fixed `8.0.2` release
  - Handle Prisma 6 `Uint8Array` byte fields
  - Replace the unmaintained `zod-prisma` generator with `zod-prisma-types` for native Zod 4 support and update API imports to the generated `*Schema` names
  - Migrate chart typings, env defaults, and generated error snapshots
  - Add regression coverage for env validation in Vitest/CI runs

- Updated dependencies [[`1a3b53a`](https://github.com/Blobscan/blobscan/commit/1a3b53a63c9feaa66acc7799e7a2b2f3d435d0dc)]:
  - @blobscan/zod@0.1.1

## 0.5.0

### Minor Changes

- [#1028](https://github.com/Blobscan/blobscan/pull/1028) [`b9e38b8`](https://github.com/Blobscan/blobscan/commit/b9e38b8b90cf354ea306f543f7d8f0679a802415) Thanks [@PJColombo](https://github.com/PJColombo)! - Replaced the legacy `daily_stats` and `overall_stats` tables with the metrics tables that Dagster populates. The stats endpoints and the counts now read `daily_metrics` and `all_time_metrics`. Removed the legacy stats syncers, the stats aggregation CLI and the legacy parity check. The stats endpoints use the new metric names (for example, `totalBlobFee` is now `totalBlobBaseFee`), and their values can be `null`

## 0.4.1

### Patch Changes

- [`7aabab6`](https://github.com/Blobscan/blobscan/commit/7aabab66121ef2f95888598f58a6d9cf69241df5) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Add optional `IPFS_STORAGE_INTERNAL_GATEWAY_URL` so IPFS-backed blob reads can use an internal gateway address separate from the public `IPFS_STORAGE_GATEWAY_URL` used to build user-facing blob links. Without this, deployments where the public gateway URL points back at the service's own public domain caused every IPFS-backed blob read to round-trip out to the internet and back to fetch its own data.

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
