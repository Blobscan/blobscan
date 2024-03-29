# @blobscan/api

## 0.5.4

### Patch Changes

- Updated dependencies [[`fc6298f`](https://github.com/Blobscan/blobscan/commit/fc6298fcbdc17b89bd0289ddd1f8d252870cd402)]:
  - @blobscan/blob-storage-manager@0.0.8
  - @blobscan/blob-propagator@0.0.8

## 0.5.3

### Patch Changes

- [#349](https://github.com/Blobscan/blobscan/pull/349) [`f138c01`](https://github.com/Blobscan/blobscan/commit/f138c01d1d656396cc6a48ee79700cd21bc9703f) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for paradex rollup and applied db migrations

- Updated dependencies [[`f138c01`](https://github.com/Blobscan/blobscan/commit/f138c01d1d656396cc6a48ee79700cd21bc9703f)]:
  - @blobscan/db@0.3.3

## 0.5.2

### Patch Changes

- [#347](https://github.com/Blobscan/blobscan/pull/347) [`24846f7`](https://github.com/Blobscan/blobscan/commit/24846f7ce2875ceabd7751f2e9359131e5820933) Thanks [@julien-marchand](https://github.com/julien-marchand)! - Added support for Linea Rollup

- Updated dependencies [[`24846f7`](https://github.com/Blobscan/blobscan/commit/24846f7ce2875ceabd7751f2e9359131e5820933)]:
  - @blobscan/db@0.3.2

## 0.5.1

### Patch Changes

- Updated dependencies [[`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5), [`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5), [`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5), [`cafdf6f`](https://github.com/Blobscan/blobscan/commit/cafdf6f5421f50ae0b88ea2563933f14e3db9d76)]:
  - @blobscan/blob-storage-manager@0.0.7
  - @blobscan/logger@0.0.6
  - @blobscan/blob-propagator@0.0.7
  - @blobscan/db@0.3.1
  - @blobscan/open-telemetry@0.0.6

## 0.5.0

### Minor Changes

- [#325](https://github.com/Blobscan/blobscan/pull/325) [`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167) Thanks [@mirshko](https://github.com/mirshko)! - Added support for mode and zora rollups

### Patch Changes

- Updated dependencies [[`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167)]:
  - @blobscan/db@0.3.0
  - @blobscan/blob-propagator@0.0.6
  - @blobscan/blob-storage-manager@0.0.6

## 0.4.2

### Patch Changes

- Updated dependencies [[`04bfb3c`](https://github.com/Blobscan/blobscan/commit/04bfb3cc78ce76f5e08cca1063f33bd6714b7096)]:
  - @blobscan/logger@0.0.5
  - @blobscan/blob-propagator@0.0.5
  - @blobscan/blob-storage-manager@0.0.5
  - @blobscan/db@0.2.1
  - @blobscan/open-telemetry@0.0.5

## 0.4.1

### Patch Changes

- [#308](https://github.com/Blobscan/blobscan/pull/308) [`62ad85c`](https://github.com/Blobscan/blobscan/commit/62ad85c74214e807d9d58a310801dee96befd93c) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for zkSync rollup

## 0.4.0

### Minor Changes

- [#277](https://github.com/Blobscan/blobscan/pull/277) [`39fb917`](https://github.com/Blobscan/blobscan/commit/39fb917444f2751ddbd1f571fdcd6f66919c078d) Thanks [@0xGabi](https://github.com/0xGabi)! - Included filter per rollup for blobs and transactions

### Patch Changes

- Updated dependencies [[`3c09b5b`](https://github.com/Blobscan/blobscan/commit/3c09b5bf8ea854f30a6675b022a87b1a04960bf6), [`1ea0023`](https://github.com/Blobscan/blobscan/commit/1ea0023cdfdba270d0cadb307f8799baa75af414)]:
  - @blobscan/zod@0.0.4
  - @blobscan/db@0.2.0
  - @blobscan/blob-propagator@0.0.4
  - @blobscan/blob-storage-manager@0.0.4
  - @blobscan/open-telemetry@0.0.4

## 0.3.0

### Minor Changes

- [#284](https://github.com/Blobscan/blobscan/pull/284) [`14c0ed0`](https://github.com/Blobscan/blobscan/commit/14c0ed06ad543239138fc5c14f753a1cf2175032) Thanks [@0xGabi](https://github.com/0xGabi)! - Enhanced the `getByBlobId` procedure to include related transactions and blocks in the blob response

### Patch Changes

- [#291](https://github.com/Blobscan/blobscan/pull/291) [`1f40a4b`](https://github.com/Blobscan/blobscan/commit/1f40a4b7dbe73a947c3325588069bbbd50b334da) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed the slot number from block IDs to eliminate ambiguities

- [#296](https://github.com/Blobscan/blobscan/pull/296) [`56ebc7d`](https://github.com/Blobscan/blobscan/commit/56ebc7d0fa44ef5abdea4df4ab31fe697bcfde21) Thanks [@0xGabi](https://github.com/0xGabi)! - Fixed blob gas as calldata calculation

- [#295](https://github.com/Blobscan/blobscan/pull/295) [`b307c59`](https://github.com/Blobscan/blobscan/commit/b307c59cace1858634b0bf54099338429c69ce63) Thanks [@0xGabi](https://github.com/0xGabi)! - Splited getByBlockId schema to handle openapi parse restrictions

- [#294](https://github.com/Blobscan/blobscan/pull/294) [`3a9c304`](https://github.com/Blobscan/blobscan/commit/3a9c3045b35dd3efef29caa75b87cbf5549f7ee2) Thanks [@0xGabi](https://github.com/0xGabi)! - Resolved overall stats format

- Updated dependencies [[`9d018bd`](https://github.com/Blobscan/blobscan/commit/9d018bd56895ad6e904bda8ec81c850c02230b11)]:
  - @blobscan/db@0.1.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`411023b`](https://github.com/Blobscan/blobscan/commit/411023b92abe25f21e06e4084faca43cde0f41c3), [`a39efaf`](https://github.com/Blobscan/blobscan/commit/a39efafec2732d0ceced9f97fc0d538cf7b0c922), [`0c937dc`](https://github.com/Blobscan/blobscan/commit/0c937dc29f1fec3e9390179f0ae37559ba5ce6c3), [`824ccc0`](https://github.com/Blobscan/blobscan/commit/824ccc01ef8c533dcf5ed8d9cd1b5f9ce30ed145)]:
  - @blobscan/db@0.1.1
  - @blobscan/zod@0.0.3
  - @blobscan/blob-propagator@0.0.3
  - @blobscan/blob-storage-manager@0.0.3
  - @blobscan/open-telemetry@0.0.3

## 0.2.0

### Minor Changes

- [#272](https://github.com/Blobscan/blobscan/pull/272) [`e4bced8`](https://github.com/Blobscan/blobscan/commit/e4bced8334239c71f59f04c0a487e2a71bca7369) Thanks [@PJColombo](https://github.com/PJColombo)! - Revamped the reorged slots handling endpoint.

  The endpoint now accepts a set of forked slots and marks those that exist in the database as reorganized. This is achieved by transferring the transactions of the corresponding blocks to the fork transactions table.

## 0.1.0

### Minor Changes

- [#259](https://github.com/Blobscan/blobscan/pull/259) [`02f5bb8`](https://github.com/Blobscan/blobscan/commit/02f5bb867ed991438950bce83fd0a41c56580679) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for new blob field (kzg proof)

- [#235](https://github.com/Blobscan/blobscan/pull/235) [`71887f8`](https://github.com/Blobscan/blobscan/commit/71887f8dc09b45b0cb0748c0d6e8ddce2662f34d) Thanks [@PJColombo](https://github.com/PJColombo)! - - Add Support For Block Reorganizations:

  - Prisma:
    - Create `TransactionFork` model.
    - Utilize the block's hash as a foreign key instead of the block number.
  - API:

    - Introduce an indexer's TRPC procedure/endpoint to manage reorganizations.
    - Enable retrieval of either normal or reorganized blocks in block getter procedures.

  - Update Blockchain Synced State by Monitoring Lower and Upper Synced Slots:

    - Prisma:
      - Add `last_lower_synced_slot` and `last_upper_synced_slot` fields to `BlockchainSyncState` model.
    - API:
      - Move the blockchain synced state updater procedure from the indexer's router to its dedicated router.
      - Overhaul blockchain synced state procedures for updating and retrieving the entire entity, rather than making granular updates.

  - Make the Last Finalized Block Optional.

- [#254](https://github.com/Blobscan/blobscan/pull/254) [`cc1b68c`](https://github.com/Blobscan/blobscan/commit/cc1b68c190a6ccd000b823e52253bebe3af8e243) Thanks [@0xGabi](https://github.com/0xGabi)! - Added the following API changes:

  - Allowed to retrieve blocks by id (hash, slot, number)
  - Allowed to retrieve blobs by id (hash, commitment)
  - Added new procedure to retrieve full entities for blocks and transactions
  - Added support for OpenAPI retrieval procedures for blobs, transactions, and blocks
  - Allowed to configure OpenAPI document baseUrl

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a) Thanks [@PJColombo](https://github.com/PJColombo)! - Eliminated the need for the Beacon API endpoint in stats calculation by tracking the last finalized block in the database and utilizing it internally.

### Patch Changes

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset

- Updated dependencies [[`71887f8`](https://github.com/Blobscan/blobscan/commit/71887f8dc09b45b0cb0748c0d6e8ddce2662f34d), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73), [`acf8dff`](https://github.com/Blobscan/blobscan/commit/acf8dff07d62a33d5dfa3789fd1f4e2aa3e968a3), [`263d86f`](https://github.com/Blobscan/blobscan/commit/263d86ff5e35f7cf9d5bf18f6b745f8dd6249e62), [`cb732e7`](https://github.com/Blobscan/blobscan/commit/cb732e7febcbc05bdec2221fec1213bcb8172717), [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a), [`5ed5186`](https://github.com/Blobscan/blobscan/commit/5ed51867d5b01b0572bfa69f3211a5b5bfaf254e)]:
  - @blobscan/db@0.1.0
  - @blobscan/blob-storage-manager@0.0.2
  - @blobscan/blob-propagator@0.0.2
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/dayjs@0.0.2
  - @blobscan/zod@0.0.2
