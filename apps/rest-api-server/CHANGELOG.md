# @blobscan/rest-api-server

## 0.1.0

### Minor Changes

- [#254](https://github.com/Blobscan/blobscan/pull/254) [`cc1b68c`](https://github.com/Blobscan/blobscan/commit/cc1b68c190a6ccd000b823e52253bebe3af8e243) Thanks [@0xGabi](https://github.com/0xGabi)! - Added the following API changes:

  - Allowed to retrieve blocks by id (hash, slot, number)
  - Allowed to retrieve blobs by id (hash, commitment)
  - Added new procedure to retrieve full entities for blocks and transactions
  - Added support for OpenAPI retrieval procedures for blobs, transactions, and blocks
  - Allowed to configure OpenAPI document baseUrl

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`3a0fe0f`](https://github.com/Blobscan/blobscan/commit/3a0fe0f46590fd3d2cc52be67491555af9eb97f4) Thanks [@PJColombo](https://github.com/PJColombo)! - Set up stats syncer

### Patch Changes

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset

- Updated dependencies [[`a42cd8c`](https://github.com/Blobscan/blobscan/commit/a42cd8c28ffc12c894577ca65ce5b51c00a970f7), [`02f5bb8`](https://github.com/Blobscan/blobscan/commit/02f5bb867ed991438950bce83fd0a41c56580679), [`0d0304e`](https://github.com/Blobscan/blobscan/commit/0d0304e3f9f01e3c5fed09c1952fb4c549fab1ea), [`c90dc34`](https://github.com/Blobscan/blobscan/commit/c90dc3486301b777e5c7612c8e59407db77fe682), [`71887f8`](https://github.com/Blobscan/blobscan/commit/71887f8dc09b45b0cb0748c0d6e8ddce2662f34d), [`2bce443`](https://github.com/Blobscan/blobscan/commit/2bce443401b1875df40298ebd957f86a92539397), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73), [`cc1b68c`](https://github.com/Blobscan/blobscan/commit/cc1b68c190a6ccd000b823e52253bebe3af8e243), [`4f26fe3`](https://github.com/Blobscan/blobscan/commit/4f26fe3bbe4a672681894294b51d4bc2359d965c), [`cfd7937`](https://github.com/Blobscan/blobscan/commit/cfd79374506bc9bb3420e6b0216642cead75f4e3), [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a)]:
  - @blobscan/stats-syncer@0.1.0
  - @blobscan/api@0.1.0
  - @blobscan/logger@0.0.2
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/zod@0.0.2
