# @blobscan/db

## 0.24.0

### Minor Changes

- [#913](https://github.com/Blobscan/blobscan/pull/913) [`6a40ea2`](https://github.com/Blobscan/blobscan/commit/6a40ea282f9e55ff54a4e17b8ab19491b79c44b9) Thanks [@PJColombo](https://github.com/PJColombo)! - Updated all network blob params calls

### Patch Changes

- [#915](https://github.com/Blobscan/blobscan/pull/915) [`ee9f18d`](https://github.com/Blobscan/blobscan/commit/ee9f18d7451c9cf58f581aceea6687eba814df33) Thanks [@PJColombo](https://github.com/PJColombo)! - Renamed `network-blob-config` package to `chains

## 0.23.0

### Minor Changes

- [#905](https://github.com/Blobscan/blobscan/pull/905) [`183ff80`](https://github.com/Blobscan/blobscan/commit/183ff805884a17e56d84bf7710a1ccaa122b117c) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added swarmy support

- [`96fd3b9`](https://github.com/Blobscan/blobscan/commit/96fd3b9ba660f48b3329ba019abd244fe9d82c9c) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - add indexes to optimize rollup blob count queries

### Patch Changes

- Updated dependencies [[`5f30a43`](https://github.com/Blobscan/blobscan/commit/5f30a435c2ded5d3c36b3c39b88ca8a582f19def)]:
  - @blobscan/logger@0.1.4

## 0.22.1

### Patch Changes

- [#899](https://github.com/Blobscan/blobscan/pull/899) [`4a98059`](https://github.com/Blobscan/blobscan/commit/4a98059612e27be8faa63c3110d530d8b5fbca3a) Thanks [@PJColombo](https://github.com/PJColombo)! - Optimized eth usd price queries with a `LEFT JOIN` to short-circuit lookups

## 0.22.0

### Minor Changes

- [#888](https://github.com/Blobscan/blobscan/pull/888) [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b) Thanks [@PJColombo](https://github.com/PJColombo)! - Created an extension for computing extra fields for different models

### Patch Changes

- [#888](https://github.com/Blobscan/blobscan/pull/888) [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b) Thanks [@PJColombo](https://github.com/PJColombo)! - Separated upsert many and eth usd fetching functions into new extensions

## 0.21.0

### Minor Changes

- [#878](https://github.com/Blobscan/blobscan/pull/878) [`3fe35fe`](https://github.com/Blobscan/blobscan/commit/3fe35fe61eb3d2bae5f37e79b9a3921c7e59ba5a) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for retrieving latest and oldest block

## 0.20.0

### Minor Changes

- [#861](https://github.com/Blobscan/blobscan/pull/861) [`77437ef`](https://github.com/Blobscan/blobscan/commit/77437ef5b3cfd26dfed0becd7d6f313373f8e4f4) Thanks [@PJColombo](https://github.com/PJColombo)! - Added blob usage size

## 0.19.0

### Minor Changes

- [#854](https://github.com/Blobscan/blobscan/pull/854) [`93dbcc1`](https://github.com/Blobscan/blobscan/commit/93dbcc1f99da33132c0d8ad7f94fd16d4836c12b) Thanks [@PJColombo](https://github.com/PJColombo)! - Added a new method to block and tx model to retrieve the eth usd price for a given block id or tx hash

## 0.18.1

### Patch Changes

- Updated dependencies []:
  - @blobscan/logger@0.1.3
  - @blobscan/open-telemetry@0.0.10

## 0.18.0

### Minor Changes

- [#794](https://github.com/Blobscan/blobscan/pull/794) [`052da7e`](https://github.com/Blobscan/blobscan/commit/052da7e93a3c3289ec67097b8f8bc34315d84b2e) Thanks [@PJColombo](https://github.com/PJColombo)! - Dropped `EthUsdPriceFeedState` model

## 0.17.0

### Minor Changes

- [#743](https://github.com/Blobscan/blobscan/pull/743) [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for zod-prisma to generate a zod schema for every Prisma model

## 0.16.0

### Minor Changes

- [#731](https://github.com/Blobscan/blobscan/pull/731) [`29b205a`](https://github.com/Blobscan/blobscan/commit/29b205a0e096a7cf42f26554c2f4818c94303295) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added ETH price feed state and eth usd price models

## 0.15.0

### Minor Changes

- [#730](https://github.com/Blobscan/blobscan/pull/730) [`8e4633e`](https://github.com/Blobscan/blobscan/commit/8e4633eee4c0b736819d56ef6dc701d3df42d04d) Thanks [@PJColombo](https://github.com/PJColombo)! - Added following rollups: abstract, aevo, ancient8, arenaz, bob, debankchain, ethernity, fraxtal, fuel, hashkey, hemi, hypr, infinaeon, ink, karak, kinto, lambda, lisk, manta, mantle, metamail, metis, mint, morph, nal, nanonnetwork, opbnb, optopia, orderly, pandasea, parallel, phala, polynomial, r0ar, race, rari, shape, snaxchain, soneium, superlumio, superseed, swanchain, swellchain, unichain, world, xga, zeronetwork and zircuit

- [#739](https://github.com/Blobscan/blobscan/pull/739) [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed the `category` field from the `Transaction` model and now derive its value from the `rollup` field

- [#739](https://github.com/Blobscan/blobscan/pull/739) [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf) Thanks [@PJColombo](https://github.com/PJColombo)! - Dropped `category` from `Transaction` model and computed it from `rollup` field

- [#739](https://github.com/Blobscan/blobscan/pull/739) [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf) Thanks [@PJColombo](https://github.com/PJColombo)! - Reallocated the `rollup` field from the `Transaction` model to the `Address` model

- [#739](https://github.com/Blobscan/blobscan/pull/739) [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf) Thanks [@PJColombo](https://github.com/PJColombo)! - Dropped `AddressCategoryInfo` and added its columns to `Address` model

## 0.14.0

### Minor Changes

- [#721](https://github.com/Blobscan/blobscan/pull/721) [`242af90`](https://github.com/Blobscan/blobscan/commit/242af90b145ec95277172dc1a74ebb222231e58a) Thanks [@PJColombo](https://github.com/PJColombo)! - Added last upper synced block root and block slot fields

## 0.13.0

### Minor Changes

- [#681](https://github.com/Blobscan/blobscan/pull/681) [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256) Thanks [@PJColombo](https://github.com/PJColombo)! - Added Weavevm blob storage support

### Patch Changes

- [#666](https://github.com/Blobscan/blobscan/pull/666) [`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202) Thanks [@PJColombo](https://github.com/PJColombo)! - Corrected an issue in upsertMany operations where the firstBlockNumber column was not updated if it contained a null value

- [#666](https://github.com/Blobscan/blobscan/pull/666) [`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202) Thanks [@PJColombo](https://github.com/PJColombo)! - Enhanced the calculation of unique blob daily aggregations to account for the uniqueness of blobs relative to previously existing blobs, rather than only within the current aggregation scope.

- Updated dependencies []:
  - @blobscan/logger@0.1.2
  - @blobscan/open-telemetry@0.0.9

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
