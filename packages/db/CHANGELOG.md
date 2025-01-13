# @blobscan/db

## 0.12.0

### Minor Changes

- [#633](https://github.com/Blobscan/blobscan/pull/633) [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea) Thanks [@PJColombo](https://github.com/PJColombo)! - Dropped blob, block and transaction overall and daily stats models

- [#633](https://github.com/Blobscan/blobscan/pull/633) [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea) Thanks [@PJColombo](https://github.com/PJColombo)! - Added overall and daily stats models

### Patch Changes

- [#643](https://github.com/Blobscan/blobscan/pull/643) [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5) Thanks [@PJColombo](https://github.com/PJColombo)! - Added address category info constraints to transaction model

- [#643](https://github.com/Blobscan/blobscan/pull/643) [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5) Thanks [@PJColombo](https://github.com/PJColombo)! - Created indexes for block number fields

## 0.11.0

### Minor Changes

- [#529](https://github.com/Blobscan/blobscan/pull/529) [`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added `decodedFields` JSON field for storing decoded-blob-related data

## 0.10.0

### Minor Changes

- [#551](https://github.com/Blobscan/blobscan/pull/551) [`7240bba`](https://github.com/Blobscan/blobscan/commit/7240bba44dfa65d208cd027d723d9fb7a2f988f7) Thanks [@PJColombo](https://github.com/PJColombo)! - Added `category` column to `Transaction` model

- [#576](https://github.com/Blobscan/blobscan/pull/576) [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026) Thanks [@PJColombo](https://github.com/PJColombo)! - Added aggregation columns to track transaction total and average blob max fees

- [#576](https://github.com/Blobscan/blobscan/pull/576) [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for category and rollup aggregations

- [#496](https://github.com/Blobscan/blobscan/pull/496) [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f) Thanks [@xFJA](https://github.com/xFJA)! - Exposed Prisma enums from a separated file

- [#584](https://github.com/Blobscan/blobscan/pull/584) [`6eb69e8`](https://github.com/Blobscan/blobscan/commit/6eb69e8c6ba1450519b13c12255749fd36c62bee) Thanks [@PJColombo](https://github.com/PJColombo)! - Added tx index to `BlobsOnTransactions` model

- [#559](https://github.com/Blobscan/blobscan/pull/559) [`3507a88`](https://github.com/Blobscan/blobscan/commit/3507a88edc5a9648664fba59f78481ecdc4ca77b) Thanks [@PJColombo](https://github.com/PJColombo)! - Added blob gas used to `Transaction` model

### Patch Changes

- Updated dependencies [[`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026)]:
  - @blobscan/dayjs@0.1.0

## 0.9.0

### Minor Changes

- [#445](https://github.com/Blobscan/blobscan/pull/445) [`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7) Thanks [@PJColombo](https://github.com/PJColombo)! - Made `proof` field on `Blob` model mandatory

### Patch Changes

- [#445](https://github.com/Blobscan/blobscan/pull/445) [`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7) Thanks [@PJColombo](https://github.com/PJColombo)! - Created index for `proof` field on `Blob` model

## 0.8.0

### Minor Changes

- [#422](https://github.com/Blobscan/blobscan/pull/422) [`a00fdbb`](https://github.com/Blobscan/blobscan/commit/a00fdbb08a5d17a07e7a4f759572fd598ccf7ce7) Thanks [@PJColombo](https://github.com/PJColombo)! - Introduced block number and timestamp columns to the transaction table, enabling faster and more efficient sorting and filtering when retrieving multiple transactions.

- [#415](https://github.com/Blobscan/blobscan/pull/415) [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Dropped average blob size stat

- [#411](https://github.com/Blobscan/blobscan/pull/411) [`363a5aa`](https://github.com/Blobscan/blobscan/commit/363a5aae45e087b8938325a472e2c1c1dcfde42d) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added an updated at field to blob storages state model

- [#423](https://github.com/Blobscan/blobscan/pull/423) [`e2bc7cc`](https://github.com/Blobscan/blobscan/commit/e2bc7ccb0cedf74fd1811f6ba76f672d67218e84) Thanks [@PJColombo](https://github.com/PJColombo)! - Introduced block number and timestamp fields to the `BlobsOnTransactions` model, enabling faster and more efficient sorting and filtering when retrieving multiple blobs.

- [#424](https://github.com/Blobscan/blobscan/pull/424) [`097f5d5`](https://github.com/Blobscan/blobscan/commit/097f5d5be60a2bfb82faf8731e1901144abf125a) Thanks [@PJColombo](https://github.com/PJColombo)! - Added transaction index

### Patch Changes

- [#419](https://github.com/Blobscan/blobscan/pull/419) [`3e15dd1`](https://github.com/Blobscan/blobscan/commit/3e15dd1bc074cde951aedf307fdbdb668bcc081b) Thanks [@PJColombo](https://github.com/PJColombo)! - Added block number index

- [#420](https://github.com/Blobscan/blobscan/pull/420) [`cd96277`](https://github.com/Blobscan/blobscan/commit/cd96277acf3a2e25f6ca1332fc66283cfd95f673) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed an issue where get latest block extension function was taking into account reorged blocks as well

- [#415](https://github.com/Blobscan/blobscan/pull/415) [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Fixed an issue where the daily average max blob gas fee wasn't getting updated when running the stats aggregations

- Updated dependencies [[`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735)]:
  - @blobscan/open-telemetry@0.0.8
  - @blobscan/logger@0.1.1

## 0.7.0

### Minor Changes

- [#409](https://github.com/Blobscan/blobscan/pull/409) [`4ff5c4d`](https://github.com/Blobscan/blobscan/commit/4ff5c4d720463fd607a32fe35466a3e0dad045f9) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for Taiko, Blast, and Optopia rollups

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

- [#271](https://github.com/Blobscan/blobscan/pull/271) [`acf8dff`](https://github.com/Blobscan/blobscan/commit/acf8dff07d62a33d5dfa3789fd1f4e2aa3e968a3) Thanks [@0xGabi](https://github.com/0xGabi)! - Updated blob kzg proof field to non-unique

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`263d86f`](https://github.com/Blobscan/blobscan/commit/263d86ff5e35f7cf9d5bf18f6b745f8dd6249e62) Thanks [@PJColombo](https://github.com/PJColombo)! - Improved date normalization error message

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`cb732e7`](https://github.com/Blobscan/blobscan/commit/cb732e7febcbc05bdec2221fec1213bcb8172717) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved Date normalization issue

- Updated dependencies [[`2bce443`](https://github.com/Blobscan/blobscan/commit/2bce443401b1875df40298ebd957f86a92539397), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73)]:
  - @blobscan/logger@0.0.2
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/dayjs@0.0.2
