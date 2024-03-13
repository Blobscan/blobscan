# @blobscan/web

## 0.3.0

### Minor Changes

- [#304](https://github.com/Blobscan/blobscan/pull/304) [`a0afd63`](https://github.com/Blobscan/blobscan/commit/a0afd638d13cd273739c7e40029db8de31794756) Thanks [@PJColombo](https://github.com/PJColombo)! - Added blob storage tags to blob details view

### Patch Changes

- [#281](https://github.com/Blobscan/blobscan/pull/281) [`6195838`](https://github.com/Blobscan/blobscan/commit/61958389e1c0fba277800c7e10d0c5e17c9c417d) Thanks [@0xGabi](https://github.com/0xGabi)! - Added rollup badges

- [#308](https://github.com/Blobscan/blobscan/pull/308) [`62ad85c`](https://github.com/Blobscan/blobscan/commit/62ad85c74214e807d9d58a310801dee96befd93c) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for zkSync rollup

- Updated dependencies [[`62ad85c`](https://github.com/Blobscan/blobscan/commit/62ad85c74214e807d9d58a310801dee96befd93c)]:
  - @blobscan/api@0.4.1

## 0.2.2

### Patch Changes

- [#300](https://github.com/Blobscan/blobscan/pull/300) [`20282a5`](https://github.com/Blobscan/blobscan/commit/20282a53da94adbef9ce184698a112dff847e92c) Thanks [@0xGabi](https://github.com/0xGabi)! - Updated next public env

## 0.2.1

### Patch Changes

- [#298](https://github.com/Blobscan/blobscan/pull/298) [`3c09b5b`](https://github.com/Blobscan/blobscan/commit/3c09b5bf8ea854f30a6675b022a87b1a04960bf6) Thanks [@0xGabi](https://github.com/0xGabi)! - Deprecated goerli network

- Updated dependencies [[`39fb917`](https://github.com/Blobscan/blobscan/commit/39fb917444f2751ddbd1f571fdcd6f66919c078d)]:
  - @blobscan/api@0.4.0
  - @blobscan/open-telemetry@0.0.4

## 0.2.0

### Minor Changes

- [#284](https://github.com/Blobscan/blobscan/pull/284) [`6949b30`](https://github.com/Blobscan/blobscan/commit/6949b3060c42616dd098484ca0d9d67c140cf2a2) Thanks [@0xGabi](https://github.com/0xGabi)! - Enhanced navigation from the blob details page, enabling direct links back to associated transactions and blocks

### Patch Changes

- [#295](https://github.com/Blobscan/blobscan/pull/295) [`b307c59`](https://github.com/Blobscan/blobscan/commit/b307c59cace1858634b0bf54099338429c69ce63) Thanks [@0xGabi](https://github.com/0xGabi)! - Splited getByBlockId schema to handle openapi parse restrictions

- Updated dependencies [[`14c0ed0`](https://github.com/Blobscan/blobscan/commit/14c0ed06ad543239138fc5c14f753a1cf2175032), [`1f40a4b`](https://github.com/Blobscan/blobscan/commit/1f40a4b7dbe73a947c3325588069bbbd50b334da), [`56ebc7d`](https://github.com/Blobscan/blobscan/commit/56ebc7d0fa44ef5abdea4df4ab31fe697bcfde21), [`b307c59`](https://github.com/Blobscan/blobscan/commit/b307c59cace1858634b0bf54099338429c69ce63), [`3a9c304`](https://github.com/Blobscan/blobscan/commit/3a9c3045b35dd3efef29caa75b87cbf5549f7ee2)]:
  - @blobscan/api@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies []:
  - @blobscan/api@0.2.1
  - @blobscan/open-telemetry@0.0.3

## 0.1.1

### Patch Changes

- Updated dependencies [[`e4bced8`](https://github.com/Blobscan/blobscan/commit/e4bced8334239c71f59f04c0a487e2a71bca7369)]:
  - @blobscan/api@0.2.0

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

### Patch Changes

- [#258](https://github.com/Blobscan/blobscan/pull/258) [`8c49f05`](https://github.com/Blobscan/blobscan/commit/8c49f059ab3c22e61fcd464e00bba659e1354b41) Thanks [@0xGabi](https://github.com/0xGabi)! - Resolved timestamp normalization issue

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset

- Updated dependencies [[`02f5bb8`](https://github.com/Blobscan/blobscan/commit/02f5bb867ed991438950bce83fd0a41c56580679), [`71887f8`](https://github.com/Blobscan/blobscan/commit/71887f8dc09b45b0cb0748c0d6e8ddce2662f34d), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73), [`cc1b68c`](https://github.com/Blobscan/blobscan/commit/cc1b68c190a6ccd000b823e52253bebe3af8e243), [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a)]:
  - @blobscan/api@0.1.0
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/dayjs@0.0.2
