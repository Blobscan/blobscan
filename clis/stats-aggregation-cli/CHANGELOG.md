# @blobscan/stats-aggregation-cli

## 0.1.11

### Patch Changes

- Updated dependencies [[`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7), [`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7)]:
  - @blobscan/db@0.9.0

## 0.1.10

### Patch Changes

- Updated dependencies [[`a00fdbb`](https://github.com/Blobscan/blobscan/commit/a00fdbb08a5d17a07e7a4f759572fd598ccf7ce7), [`3e15dd1`](https://github.com/Blobscan/blobscan/commit/3e15dd1bc074cde951aedf307fdbdb668bcc081b), [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`cd96277`](https://github.com/Blobscan/blobscan/commit/cd96277acf3a2e25f6ca1332fc66283cfd95f673), [`363a5aa`](https://github.com/Blobscan/blobscan/commit/363a5aae45e087b8938325a472e2c1c1dcfde42d), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`e2bc7cc`](https://github.com/Blobscan/blobscan/commit/e2bc7ccb0cedf74fd1811f6ba76f672d67218e84), [`097f5d5`](https://github.com/Blobscan/blobscan/commit/097f5d5be60a2bfb82faf8731e1901144abf125a)]:
  - @blobscan/db@0.8.0
  - @blobscan/logger@0.1.1

## 0.1.9

### Patch Changes

- Updated dependencies [[`4ff5c4d`](https://github.com/Blobscan/blobscan/commit/4ff5c4d720463fd607a32fe35466a3e0dad045f9)]:
  - @blobscan/db@0.7.0

## 0.1.8

### Patch Changes

- Updated dependencies [[`9d2e6ac`](https://github.com/Blobscan/blobscan/commit/9d2e6aca545a3dde9be5742afbe71b12d675420c)]:
  - @blobscan/db@0.6.0

## 0.1.7

### Patch Changes

- Updated dependencies [[`0a61aec`](https://github.com/Blobscan/blobscan/commit/0a61aec545fa1b3b7a44b2a7c9e9a8e8250c1362), [`72e4b96`](https://github.com/Blobscan/blobscan/commit/72e4b963e2e735156032467554e6cc3cd311097e), [`7bb6f49`](https://github.com/Blobscan/blobscan/commit/7bb6f4912c89d0dd436e325677c801200e32edba), [`5ffb8ca`](https://github.com/Blobscan/blobscan/commit/5ffb8ca355bfcd02393a3b40e89b9d7a1a5a05e8), [`89df217`](https://github.com/Blobscan/blobscan/commit/89df217e817727a710a7c3217ad7be4750de93ce), [`b4e8d2c`](https://github.com/Blobscan/blobscan/commit/b4e8d2cd63d4f2b307f21848c23da14acc265ab0)]:
  - @blobscan/logger@0.1.0
  - @blobscan/db@0.5.0

## 0.1.6

### Patch Changes

- Updated dependencies [[`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8)]:
  - @blobscan/db@0.4.0

## 0.1.5

### Patch Changes

- Updated dependencies [[`cafdf6f`](https://github.com/Blobscan/blobscan/commit/cafdf6f5421f50ae0b88ea2563933f14e3db9d76)]:
  - @blobscan/logger@0.0.6
  - @blobscan/db@0.3.1

## 0.1.4

### Patch Changes

- Updated dependencies [[`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167)]:
  - @blobscan/db@0.3.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`04bfb3c`](https://github.com/Blobscan/blobscan/commit/04bfb3cc78ce76f5e08cca1063f33bd6714b7096)]:
  - @blobscan/logger@0.0.5
  - @blobscan/db@0.2.1

## 0.1.2

### Patch Changes

- Updated dependencies [[`1ea0023`](https://github.com/Blobscan/blobscan/commit/1ea0023cdfdba270d0cadb307f8799baa75af414)]:
  - @blobscan/db@0.2.0
  - @blobscan/logger@0.0.4

## 0.1.1

### Patch Changes

- Updated dependencies [[`411023b`](https://github.com/Blobscan/blobscan/commit/411023b92abe25f21e06e4084faca43cde0f41c3), [`0c937dc`](https://github.com/Blobscan/blobscan/commit/0c937dc29f1fec3e9390179f0ae37559ba5ce6c3), [`824ccc0`](https://github.com/Blobscan/blobscan/commit/824ccc01ef8c533dcf5ed8d9cd1b5f9ce30ed145)]:
  - @blobscan/db@0.1.1
  - @blobscan/logger@0.0.3

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

### Patch Changes

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`3a77742`](https://github.com/Blobscan/blobscan/commit/3a7774290ad1bb082bd47b315ef2a6f6be422c6f) Thanks [@PJColombo](https://github.com/PJColombo)! - - Used blobscan's logger.

  - Added custom command errors.

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a) Thanks [@PJColombo](https://github.com/PJColombo)! - Eliminated the need for the Beacon API endpoint in stats calculation by tracking the last finalized block in the database and utilizing it internally.

- Updated dependencies [[`71887f8`](https://github.com/Blobscan/blobscan/commit/71887f8dc09b45b0cb0748c0d6e8ddce2662f34d), [`2bce443`](https://github.com/Blobscan/blobscan/commit/2bce443401b1875df40298ebd957f86a92539397), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73), [`acf8dff`](https://github.com/Blobscan/blobscan/commit/acf8dff07d62a33d5dfa3789fd1f4e2aa3e968a3), [`263d86f`](https://github.com/Blobscan/blobscan/commit/263d86ff5e35f7cf9d5bf18f6b745f8dd6249e62), [`cb732e7`](https://github.com/Blobscan/blobscan/commit/cb732e7febcbc05bdec2221fec1213bcb8172717), [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a), [`5ed5186`](https://github.com/Blobscan/blobscan/commit/5ed51867d5b01b0572bfa69f3211a5b5bfaf254e)]:
  - @blobscan/db@0.1.0
  - @blobscan/logger@0.0.2
  - @blobscan/dayjs@0.0.2
