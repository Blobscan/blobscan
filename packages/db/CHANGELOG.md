# @blobscan/db

## 0.6.0

### Minor Changes

- [#398](https://github.com/Blobscan/blobscan/pull/398) [`9d2e6ac`](https://github.com/Blobscan/blobscan/commit/9d2e6aca545a3dde9be5742afbe71b12d675420c) Thanks [@0xGabi](https://github.com/0xGabi)! - Added sepolia new rollups

## 0.5.0

### Minor Changes

- [#380](https://github.com/Blobscan/blobscan/pull/380) [`89df217`](https://github.com/Blobscan/blobscan/commit/89df217e817727a710a7c3217ad7be4750de93ce) Thanks [@PJColombo](https://github.com/PJColombo)! - Dropped `filterNewBlobs` method from base extension

### Patch Changes

- [#387](https://github.com/Blobscan/blobscan/pull/387) [`b4e8d2c`](https://github.com/Blobscan/blobscan/commit/b4e8d2cd63d4f2b307f21848c23da14acc265ab0) Thanks [@0xGabi](https://github.com/0xGabi)! - Added boba, camp, kroma, metal and pgn rollups

- Updated dependencies [[`0a61aec`](https://github.com/Blobscan/blobscan/commit/0a61aec545fa1b3b7a44b2a7c9e9a8e8250c1362), [`72e4b96`](https://github.com/Blobscan/blobscan/commit/72e4b963e2e735156032467554e6cc3cd311097e), [`7bb6f49`](https://github.com/Blobscan/blobscan/commit/7bb6f4912c89d0dd436e325677c801200e32edba), [`5ffb8ca`](https://github.com/Blobscan/blobscan/commit/5ffb8ca355bfcd02393a3b40e89b9d7a1a5a05e8)]:
  - @blobscan/logger@0.1.0
  - @blobscan/open-telemetry@0.0.7

## 0.4.0

### Minor Changes

- [#358](https://github.com/Blobscan/blobscan/pull/358) [`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8) Thanks [@PJColombo](https://github.com/PJColombo)! - Added file system blob storage

## 0.3.3

### Patch Changes

- [#349](https://github.com/Blobscan/blobscan/pull/349) [`f138c01`](https://github.com/Blobscan/blobscan/commit/f138c01d1d656396cc6a48ee79700cd21bc9703f) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for paradex rollup and applied db migrations

## 0.3.2

### Patch Changes

- [#347](https://github.com/Blobscan/blobscan/pull/347) [`24846f7`](https://github.com/Blobscan/blobscan/commit/24846f7ce2875ceabd7751f2e9359131e5820933) Thanks [@julien-marchand](https://github.com/julien-marchand)! - Added support for Linea Rollup

## 0.3.1

### Patch Changes

- Updated dependencies [[`cafdf6f`](https://github.com/Blobscan/blobscan/commit/cafdf6f5421f50ae0b88ea2563933f14e3db9d76)]:
  - @blobscan/logger@0.0.6
  - @blobscan/open-telemetry@0.0.6

## 0.3.0

### Minor Changes

- [#325](https://github.com/Blobscan/blobscan/pull/325) [`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167) Thanks [@mirshko](https://github.com/mirshko)! - Added support for mode and zora rollups

## 0.2.1

### Patch Changes

- Updated dependencies [[`04bfb3c`](https://github.com/Blobscan/blobscan/commit/04bfb3cc78ce76f5e08cca1063f33bd6714b7096)]:
  - @blobscan/logger@0.0.5
  - @blobscan/open-telemetry@0.0.5

## 0.2.0

### Minor Changes

- [#277](https://github.com/Blobscan/blobscan/pull/277) [`1ea0023`](https://github.com/Blobscan/blobscan/commit/1ea0023cdfdba270d0cadb307f8799baa75af414) Thanks [@0xGabi](https://github.com/0xGabi)! - Added Rollup enum and new source rollup field on tx model

### Patch Changes

- Updated dependencies []:
  - @blobscan/logger@0.0.4
  - @blobscan/open-telemetry@0.0.4

## 0.1.2

### Patch Changes

- [#287](https://github.com/Blobscan/blobscan/pull/287) [`9d018bd`](https://github.com/Blobscan/blobscan/commit/9d018bd56895ad6e904bda8ec81c850c02230b11) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved an issue where reorged blocks where being included in the daily stats aggregations

## 0.1.1

### Patch Changes

- [#275](https://github.com/Blobscan/blobscan/pull/275) [`411023b`](https://github.com/Blobscan/blobscan/commit/411023b92abe25f21e06e4084faca43cde0f41c3) Thanks [@PJColombo](https://github.com/PJColombo)! - Abstracted date normalization into its own function

- [#278](https://github.com/Blobscan/blobscan/pull/278) [`0c937dc`](https://github.com/Blobscan/blobscan/commit/0c937dc29f1fec3e9390179f0ae37559ba5ce6c3) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed a bug where reorganized blocks were mistakenly included in the aggregation process for stats calculation.

- [#278](https://github.com/Blobscan/blobscan/pull/278) [`824ccc0`](https://github.com/Blobscan/blobscan/commit/824ccc01ef8c533dcf5ed8d9cd1b5f9ce30ed145) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved an issue where incrementally updating average-related statistics with a new value of zero—due to the absence of data in the new block range—incorrectly reduced the current average, instead of properly handling cases with no blocks.

- Updated dependencies []:
  - @blobscan/logger@0.0.3
  - @blobscan/open-telemetry@0.0.3

## 0.1.0

### Minor Changes

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

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a) Thanks [@PJColombo](https://github.com/PJColombo)! - Eliminated the need for the Beacon API endpoint in stats calculation by tracking the last finalized block in the database and utilizing it internally.

- [#259](https://github.com/Blobscan/blobscan/pull/259) [`5ed5186`](https://github.com/Blobscan/blobscan/commit/5ed51867d5b01b0572bfa69f3211a5b5bfaf254e) Thanks [@0xGabi](https://github.com/0xGabi)! - Added kzg proof field to Blob table

### Patch Changes

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset

- [#271](https://github.com/Blobscan/blobscan/pull/271) [`acf8dff`](https://github.com/Blobscan/blobscan/commit/acf8dff07d62a33d5dfa3789fd1f4e2aa3e968a3) Thanks [@0xGabi](https://github.com/0xGabi)! - Updated blob kzg proof field to non unique

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`263d86f`](https://github.com/Blobscan/blobscan/commit/263d86ff5e35f7cf9d5bf18f6b745f8dd6249e62) Thanks [@PJColombo](https://github.com/PJColombo)! - Improved date normalization error message

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`cb732e7`](https://github.com/Blobscan/blobscan/commit/cb732e7febcbc05bdec2221fec1213bcb8172717) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved Date normalization issue

- Updated dependencies [[`2bce443`](https://github.com/Blobscan/blobscan/commit/2bce443401b1875df40298ebd957f86a92539397), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73)]:
  - @blobscan/logger@0.0.2
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/dayjs@0.0.2
