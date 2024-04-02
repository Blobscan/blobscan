# @blobscan/rest-api-server

## 0.3.6

### Patch Changes

- Updated dependencies [[`206612c`](https://github.com/Blobscan/blobscan/commit/206612c839226972dcac39903e2f327a3207c456), [`7bd5980`](https://github.com/Blobscan/blobscan/commit/7bd59806fe299de53c3476103a54f7c528eb3089), [`3828885`](https://github.com/Blobscan/blobscan/commit/38288856af47de5573b64feeb82c7c9e05b91339), [`4ebf184`](https://github.com/Blobscan/blobscan/commit/4ebf184cbb928a510a0ec201869a9413787a0036), [`b2d1e16`](https://github.com/Blobscan/blobscan/commit/b2d1e16456321c9ab5420114e93173cdaf27d938), [`aeaae7f`](https://github.com/Blobscan/blobscan/commit/aeaae7fdfe1dc800955643fe651cd264a6676b6c), [`7bd5980`](https://github.com/Blobscan/blobscan/commit/7bd59806fe299de53c3476103a54f7c528eb3089)]:
  - @blobscan/api@0.7.0

## 0.3.5

### Patch Changes

- Updated dependencies [[`37539a6`](https://github.com/Blobscan/blobscan/commit/37539a6881e1cffe2cd3e7ef6f1686e6d6f39bd7)]:
  - @blobscan/api@0.6.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`cafdf6f`](https://github.com/Blobscan/blobscan/commit/cafdf6f5421f50ae0b88ea2563933f14e3db9d76)]:
  - @blobscan/logger@0.0.6
  - @blobscan/api@0.5.1
  - @blobscan/open-telemetry@0.0.6
  - @blobscan/stats-syncer@0.1.5

## 0.3.3

### Patch Changes

- Updated dependencies [[`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167)]:
  - @blobscan/api@0.5.0
  - @blobscan/stats-syncer@0.1.4

## 0.3.2

### Patch Changes

- Updated dependencies [[`04bfb3c`](https://github.com/Blobscan/blobscan/commit/04bfb3cc78ce76f5e08cca1063f33bd6714b7096)]:
  - @blobscan/logger@0.0.5
  - @blobscan/api@0.4.2
  - @blobscan/open-telemetry@0.0.5
  - @blobscan/stats-syncer@0.1.3

## 0.3.1

### Patch Changes

- [#312](https://github.com/Blobscan/blobscan/pull/312) [`93ee664`](https://github.com/Blobscan/blobscan/commit/93ee664f948b400025261fd0e3afda26006583e7) Thanks [@0xGabi](https://github.com/0xGabi)! - Allowed logs on production environment

## 0.3.0

### Minor Changes

- [#309](https://github.com/Blobscan/blobscan/pull/309) [`20de8e0`](https://github.com/Blobscan/blobscan/commit/20de8e013b2703b98436f773f4ced24ed7200dea) Thanks [@0xGabi](https://github.com/0xGabi)! - Updated the order in which we initialize the api handlers

## 0.2.0

### Minor Changes

- [#277](https://github.com/Blobscan/blobscan/pull/277) [`39fb917`](https://github.com/Blobscan/blobscan/commit/39fb917444f2751ddbd1f571fdcd6f66919c078d) Thanks [@0xGabi](https://github.com/0xGabi)! - Included filter per rollup for blobs and transactions

### Patch Changes

- [#298](https://github.com/Blobscan/blobscan/pull/298) [`3c09b5b`](https://github.com/Blobscan/blobscan/commit/3c09b5bf8ea854f30a6675b022a87b1a04960bf6) Thanks [@0xGabi](https://github.com/0xGabi)! - Deprecated goerli network

- Updated dependencies [[`39fb917`](https://github.com/Blobscan/blobscan/commit/39fb917444f2751ddbd1f571fdcd6f66919c078d), [`3c09b5b`](https://github.com/Blobscan/blobscan/commit/3c09b5bf8ea854f30a6675b022a87b1a04960bf6)]:
  - @blobscan/api@0.4.0
  - @blobscan/zod@0.0.4
  - @blobscan/logger@0.0.4
  - @blobscan/open-telemetry@0.0.4
  - @blobscan/stats-syncer@0.1.2

## 0.1.3

### Patch Changes

- [#295](https://github.com/Blobscan/blobscan/pull/295) [`b307c59`](https://github.com/Blobscan/blobscan/commit/b307c59cace1858634b0bf54099338429c69ce63) Thanks [@0xGabi](https://github.com/0xGabi)! - Splited getByBlockId schema to handle openapi parse restrictions

- Updated dependencies [[`14c0ed0`](https://github.com/Blobscan/blobscan/commit/14c0ed06ad543239138fc5c14f753a1cf2175032), [`1f40a4b`](https://github.com/Blobscan/blobscan/commit/1f40a4b7dbe73a947c3325588069bbbd50b334da), [`56ebc7d`](https://github.com/Blobscan/blobscan/commit/56ebc7d0fa44ef5abdea4df4ab31fe697bcfde21), [`b307c59`](https://github.com/Blobscan/blobscan/commit/b307c59cace1858634b0bf54099338429c69ce63), [`3a9c304`](https://github.com/Blobscan/blobscan/commit/3a9c3045b35dd3efef29caa75b87cbf5549f7ee2)]:
  - @blobscan/api@0.3.0

## 0.1.2

### Patch Changes

- [#279](https://github.com/Blobscan/blobscan/pull/279) [`a39efaf`](https://github.com/Blobscan/blobscan/commit/a39efafec2732d0ceced9f97fc0d538cf7b0c922) Thanks [@PJColombo](https://github.com/PJColombo)! - Adjusted stats syncer to default to the network's Dencun fork slot when no specific fork slot is provided.

- Updated dependencies [[`7e221cd`](https://github.com/Blobscan/blobscan/commit/7e221cd1226be84418658e3d6309dc0e396f671e), [`a39efaf`](https://github.com/Blobscan/blobscan/commit/a39efafec2732d0ceced9f97fc0d538cf7b0c922)]:
  - @blobscan/stats-syncer@0.1.1
  - @blobscan/zod@0.0.3
  - @blobscan/api@0.2.1
  - @blobscan/logger@0.0.3
  - @blobscan/open-telemetry@0.0.3

## 0.1.1

### Patch Changes

- Updated dependencies [[`e4bced8`](https://github.com/Blobscan/blobscan/commit/e4bced8334239c71f59f04c0a487e2a71bca7369)]:
  - @blobscan/api@0.2.0

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
