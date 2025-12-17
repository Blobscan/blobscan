# @blobscan/rest-api-server

## 0.11.2

### Patch Changes

- Updated dependencies [[`fea097f`](https://github.com/Blobscan/blobscan/commit/fea097f1ba88dae6639a93f975a19dea7ce16107)]:
  - @blobscan/db@0.26.0
  - @blobscan/api@1.0.0
  - @blobscan/blob-propagator@1.0.0
  - @blobscan/blob-storage-manager@1.0.0
  - @blobscan/rollups@1.0.0
  - @blobscan/syncers@0.6.4

## 0.11.1

### Patch Changes

- Updated dependencies [[`d752744`](https://github.com/Blobscan/blobscan/commit/d752744ac75f65bc53ceb32dc181d11b1f020ef4), [`d752744`](https://github.com/Blobscan/blobscan/commit/d752744ac75f65bc53ceb32dc181d11b1f020ef4), [`1e87f0e`](https://github.com/Blobscan/blobscan/commit/1e87f0ec6a9c94adb4fbecea7e6780f1ea1ff4ad), [`52ed449`](https://github.com/Blobscan/blobscan/commit/52ed449be8721dcf9352a9222cf087be2e6ba6bc)]:
  - @blobscan/api@0.31.1
  - @blobscan/rollups@0.4.0
  - @blobscan/db@0.25.0
  - @blobscan/blob-propagator@0.6.4
  - @blobscan/blob-storage-manager@0.8.2
  - @blobscan/syncers@0.6.3

## 0.11.0

### Minor Changes

- [#916](https://github.com/Blobscan/blobscan/pull/916) [`dc1c80b`](https://github.com/Blobscan/blobscan/commit/dc1c80b1d1e584265e9021bd22a6500801073e55) Thanks [@PJColombo](https://github.com/PJColombo)! - Bumped request body size limit to 8MB to support Fusaka's increased blob payload size

- [#916](https://github.com/Blobscan/blobscan/pull/916) [`dc1c80b`](https://github.com/Blobscan/blobscan/commit/dc1c80b1d1e584265e9021bd22a6500801073e55) Thanks [@PJColombo](https://github.com/PJColombo)! - Adds an Express error-handling middleware and process-level handlers for uncaught exceptions and unhandled promise rejections.

### Patch Changes

- [#916](https://github.com/Blobscan/blobscan/pull/916) [`dc1c80b`](https://github.com/Blobscan/blobscan/commit/dc1c80b1d1e584265e9021bd22a6500801073e55) Thanks [@PJColombo](https://github.com/PJColombo)! - Prevented leaking internal 500 error details by returning a generic internal server error message to clients.

- [#916](https://github.com/Blobscan/blobscan/pull/916) [`dc1c80b`](https://github.com/Blobscan/blobscan/commit/dc1c80b1d1e584265e9021bd22a6500801073e55) Thanks [@PJColombo](https://github.com/PJColombo)! - Prevented logging non-500 errors as error-level logs.

## 0.10.0

### Minor Changes

- [#913](https://github.com/Blobscan/blobscan/pull/913) [`6a40ea2`](https://github.com/Blobscan/blobscan/commit/6a40ea282f9e55ff54a4e17b8ab19491b79c44b9) Thanks [@PJColombo](https://github.com/PJColombo)! - Updated all network blob params calls

### Patch Changes

- [#915](https://github.com/Blobscan/blobscan/pull/915) [`ee9f18d`](https://github.com/Blobscan/blobscan/commit/ee9f18d7451c9cf58f581aceea6687eba814df33) Thanks [@PJColombo](https://github.com/PJColombo)! - Renamed `network-blob-config` package to `chains

- Updated dependencies [[`6a40ea2`](https://github.com/Blobscan/blobscan/commit/6a40ea282f9e55ff54a4e17b8ab19491b79c44b9), [`6a40ea2`](https://github.com/Blobscan/blobscan/commit/6a40ea282f9e55ff54a4e17b8ab19491b79c44b9), [`ee9f18d`](https://github.com/Blobscan/blobscan/commit/ee9f18d7451c9cf58f581aceea6687eba814df33), [`6a40ea2`](https://github.com/Blobscan/blobscan/commit/6a40ea282f9e55ff54a4e17b8ab19491b79c44b9)]:
  - @blobscan/chains@0.4.0
  - @blobscan/api@0.31.0
  - @blobscan/db@0.24.0
  - @blobscan/blob-propagator@0.6.3
  - @blobscan/blob-storage-manager@0.8.1
  - @blobscan/syncers@0.6.2

## 0.9.0

### Minor Changes

- [#905](https://github.com/Blobscan/blobscan/pull/905) [`183ff80`](https://github.com/Blobscan/blobscan/commit/183ff805884a17e56d84bf7710a1ccaa122b117c) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added support for swarmy cloud blob storage

### Patch Changes

- [#911](https://github.com/Blobscan/blobscan/pull/911) [`85772c4`](https://github.com/Blobscan/blobscan/commit/85772c4e6cb493ef0f5c3bbb3f540b6c0c63dc7b) Thanks [@PJColombo](https://github.com/PJColombo)! - Increased request body size limit

- Updated dependencies [[`183ff80`](https://github.com/Blobscan/blobscan/commit/183ff805884a17e56d84bf7710a1ccaa122b117c), [`183ff80`](https://github.com/Blobscan/blobscan/commit/183ff805884a17e56d84bf7710a1ccaa122b117c), [`779fafa`](https://github.com/Blobscan/blobscan/commit/779fafafc590ff2b0e98d72feb3af003095a8cf6), [`96fd3b9`](https://github.com/Blobscan/blobscan/commit/96fd3b9ba660f48b3329ba019abd244fe9d82c9c), [`5f30a43`](https://github.com/Blobscan/blobscan/commit/5f30a435c2ded5d3c36b3c39b88ca8a582f19def)]:
  - @blobscan/db@0.23.0
  - @blobscan/blob-storage-manager@0.8.0
  - @blobscan/api@0.30.2
  - @blobscan/blob-propagator@0.6.2
  - @blobscan/syncers@0.6.1
  - @blobscan/logger@0.1.4

## 0.8.3

### Patch Changes

- Updated dependencies [[`b03b099`](https://github.com/Blobscan/blobscan/commit/b03b09921556f30bb7c0aad6f06215161e7e12a3), [`606c2c0`](https://github.com/Blobscan/blobscan/commit/606c2c0faa054be1848f89901c25b4f70196f396), [`b03b099`](https://github.com/Blobscan/blobscan/commit/b03b09921556f30bb7c0aad6f06215161e7e12a3)]:
  - @blobscan/api@0.30.0

## 0.8.2

### Patch Changes

- [#895](https://github.com/Blobscan/blobscan/pull/895) [`c497d51`](https://github.com/Blobscan/blobscan/commit/c497d51241512dc5c09f19cba65f0424295e146a) Thanks [@PJColombo](https://github.com/PJColombo)! - Updated to use a singleton Redis client for trpc middleware and blob propagator service

- Updated dependencies [[`5df65d3`](https://github.com/Blobscan/blobscan/commit/5df65d3387b2e66ef40aa941aebcd2f239405874), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b), [`c497d51`](https://github.com/Blobscan/blobscan/commit/c497d51241512dc5c09f19cba65f0424295e146a), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b)]:
  - @blobscan/api@0.29.0
  - @blobscan/db@0.22.0
  - @blobscan/blob-storage-manager@0.7.0
  - @blobscan/syncers@0.6.0
  - @blobscan/blob-propagator@0.6.1

## 0.8.1

### Patch Changes

- Updated dependencies [[`64ac4eb`](https://github.com/Blobscan/blobscan/commit/64ac4eb9a5b832e8b68c580c179d1c83f291f6cc)]:
  - @blobscan/blob-propagator@0.6.0
  - @blobscan/api@0.28.1

## 0.8.0

### Minor Changes

- [#876](https://github.com/Blobscan/blobscan/pull/876) [`242ac1e`](https://github.com/Blobscan/blobscan/commit/242ac1e782cdb13b1867e199eb8c6c5f1a4d5dad) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for blob propagation reconciliation worker

- [#882](https://github.com/Blobscan/blobscan/pull/882) [`f483bcc`](https://github.com/Blobscan/blobscan/commit/f483bcc6fe2412b059ee4bc16d9029e836372e6a) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed an issue where exceptions occuring during REST API setup weren't being captured

### Patch Changes

- [#879](https://github.com/Blobscan/blobscan/pull/879) [`b0ca3c0`](https://github.com/Blobscan/blobscan/commit/b0ca3c09527cbb961921bd6298afd116e9b60482) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved an issue where the primary blob storage for the blob propagator was created even if it was not enabled

- Updated dependencies [[`242ac1e`](https://github.com/Blobscan/blobscan/commit/242ac1e782cdb13b1867e199eb8c6c5f1a4d5dad), [`3fe35fe`](https://github.com/Blobscan/blobscan/commit/3fe35fe61eb3d2bae5f37e79b9a3921c7e59ba5a), [`242ac1e`](https://github.com/Blobscan/blobscan/commit/242ac1e782cdb13b1867e199eb8c6c5f1a4d5dad), [`242ac1e`](https://github.com/Blobscan/blobscan/commit/242ac1e782cdb13b1867e199eb8c6c5f1a4d5dad)]:
  - @blobscan/blob-propagator@0.6.1
  - @blobscan/api@0.29.0
  - @blobscan/db@0.21.0
  - @blobscan/blob-storage-manager@0.7.0
  - @blobscan/syncers@0.5.3

## 0.7.3

### Patch Changes

- Updated dependencies [[`77437ef`](https://github.com/Blobscan/blobscan/commit/77437ef5b3cfd26dfed0becd7d6f313373f8e4f4)]:
  - @blobscan/api@0.27.0
  - @blobscan/db@0.20.0
  - @blobscan/blob-propagator@0.4.2
  - @blobscan/blob-storage-manager@0.6.3
  - @blobscan/syncers@0.5.2

## 0.7.2

### Patch Changes

- Updated dependencies [[`93dbcc1`](https://github.com/Blobscan/blobscan/commit/93dbcc1f99da33132c0d8ad7f94fd16d4836c12b), [`93dbcc1`](https://github.com/Blobscan/blobscan/commit/93dbcc1f99da33132c0d8ad7f94fd16d4836c12b), [`93dbcc1`](https://github.com/Blobscan/blobscan/commit/93dbcc1f99da33132c0d8ad7f94fd16d4836c12b)]:
  - @blobscan/db@0.19.0
  - @blobscan/api@0.26.0
  - @blobscan/blob-propagator@0.4.1
  - @blobscan/blob-storage-manager@0.6.2
  - @blobscan/syncers@0.5.1

## 0.7.1

### Patch Changes

- Updated dependencies [[`bd0efa3`](https://github.com/Blobscan/blobscan/commit/bd0efa3d3e3ee46305e45cac552c238d0568b6fa)]:
  - @blobscan/api@0.25.0

## 0.7.0

### Minor Changes

- [#837](https://github.com/Blobscan/blobscan/pull/837) [`3518952`](https://github.com/Blobscan/blobscan/commit/3518952f41d9c0a221e30c33a58578dde6fd1ed9) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for prioritizing blob propagation jobs

### Patch Changes

- Updated dependencies [[`02ef0a0`](https://github.com/Blobscan/blobscan/commit/02ef0a00401dc5f0d9f591f23ed0187060189431), [`3518952`](https://github.com/Blobscan/blobscan/commit/3518952f41d9c0a221e30c33a58578dde6fd1ed9), [`5c786c5`](https://github.com/Blobscan/blobscan/commit/5c786c5c521a7f44f8bc88d5622fc26f311a2dfb)]:
  - @blobscan/api@0.24.0
  - @blobscan/blob-propagator@0.4.0

## 0.6.0

### Minor Changes

- [#831](https://github.com/Blobscan/blobscan/pull/831) [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e) Thanks [@PJColombo](https://github.com/PJColombo)! - Instantiated Blob Storage Manager and Propagator instead of relying on shared singleton

- [#833](https://github.com/Blobscan/blobscan/pull/833) [`52b89d6`](https://github.com/Blobscan/blobscan/commit/52b89d6a90200eea5647c49bb5fba8c0b0ff1529) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for configurating blob retention mode on blob propagator

- [#831](https://github.com/Blobscan/blobscan/pull/831) [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e) Thanks [@PJColombo](https://github.com/PJColombo)! - Added separate router entrypoints for Web and REST API apps

### Patch Changes

- Updated dependencies [[`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e), [`095564d`](https://github.com/Blobscan/blobscan/commit/095564d18b1200243ea272df1be55c4567978834), [`d579a78`](https://github.com/Blobscan/blobscan/commit/d579a788f6baa152ffca3344fc5207ecd2d104a4), [`f64d961`](https://github.com/Blobscan/blobscan/commit/f64d961a166cc6fe4ae9397d2d54b24c3764f13d), [`52b89d6`](https://github.com/Blobscan/blobscan/commit/52b89d6a90200eea5647c49bb5fba8c0b0ff1529), [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e), [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e), [`d579a78`](https://github.com/Blobscan/blobscan/commit/d579a788f6baa152ffca3344fc5207ecd2d104a4)]:
  - @blobscan/api@0.24.0
  - @blobscan/blob-propagator@0.3.0
  - @blobscan/blob-storage-manager@0.6.0
  - @blobscan/env@0.2.0
  - @blobscan/db@0.18.1
  - @blobscan/logger@0.1.3
  - @blobscan/open-telemetry@0.0.10

## 0.5.3

### Patch Changes

- Updated dependencies [[`783216a`](https://github.com/Blobscan/blobscan/commit/783216ad98c611c84642fa776a9ea35db3d97d5e), [`052da7e`](https://github.com/Blobscan/blobscan/commit/052da7e93a3c3289ec67097b8f8bc34315d84b2e), [`783216a`](https://github.com/Blobscan/blobscan/commit/783216ad98c611c84642fa776a9ea35db3d97d5e), [`052da7e`](https://github.com/Blobscan/blobscan/commit/052da7e93a3c3289ec67097b8f8bc34315d84b2e), [`3564e6e`](https://github.com/Blobscan/blobscan/commit/3564e6e79bc187b6bcb8cf99d901dfd9b233afb2), [`46a9699`](https://github.com/Blobscan/blobscan/commit/46a96994f5fd01ff1cf109f2c561203bfb475f50), [`46a9699`](https://github.com/Blobscan/blobscan/commit/46a96994f5fd01ff1cf109f2c561203bfb475f50), [`3564e6e`](https://github.com/Blobscan/blobscan/commit/3564e6e79bc187b6bcb8cf99d901dfd9b233afb2)]:
  - @blobscan/api@0.23.0
  - @blobscan/syncers@0.5.0
  - @blobscan/price-feed@0.1.0

## 0.5.2

### Patch Changes

- Updated dependencies [[`3b54479`](https://github.com/Blobscan/blobscan/commit/3b54479da9d7e49398bd8f2b6ad8882b9fcb7a24), [`969ab8f`](https://github.com/Blobscan/blobscan/commit/969ab8f757b77698ebd855425541ef209295d3c8)]:
  - @blobscan/syncers@0.4.2
  - @blobscan/api@0.22.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc), [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc), [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92), [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc), [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92), [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc), [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92)]:
  - @blobscan/api@0.21.0
  - @blobscan/syncers@0.4.1

## 0.5.0

### Minor Changes

- [#731](https://github.com/Blobscan/blobscan/pull/731) [`29b205a`](https://github.com/Blobscan/blobscan/commit/29b205a0e096a7cf42f26554c2f4818c94303295) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added ETH price syncer

### Patch Changes

- Updated dependencies [[`29b205a`](https://github.com/Blobscan/blobscan/commit/29b205a0e096a7cf42f26554c2f4818c94303295), [`b6217e8`](https://github.com/Blobscan/blobscan/commit/b6217e810f77d105df356b866d5df432a96d88ab)]:
  - @blobscan/syncers@0.4.0
  - @blobscan/api@0.20.0

## 0.4.9

### Patch Changes

- [#742](https://github.com/Blobscan/blobscan/pull/742) [`4c1c659`](https://github.com/Blobscan/blobscan/commit/4c1c65947589a9d3a2e790409d07a6b94a32f6cf) Thanks [@PJColombo](https://github.com/PJColombo)! - Increased maximum request body size allowed

- Updated dependencies [[`8e4633e`](https://github.com/Blobscan/blobscan/commit/8e4633eee4c0b736819d56ef6dc701d3df42d04d), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf)]:
  - @blobscan/api@0.19.0
  - @blobscan/syncers@0.3.5

## 0.4.8

### Patch Changes

- Updated dependencies [[`9f88066`](https://github.com/Blobscan/blobscan/commit/9f88066f7445d3bfddc9088fe7078a9d53d9828e), [`242af90`](https://github.com/Blobscan/blobscan/commit/242af90b145ec95277172dc1a74ebb222231e58a), [`b90971b`](https://github.com/Blobscan/blobscan/commit/b90971b1415e32c23c530feff1fc2dd1560d377d), [`95f8043`](https://github.com/Blobscan/blobscan/commit/95f8043f253e83d37e224ccfd63f4c61088af4c2), [`27cddc4`](https://github.com/Blobscan/blobscan/commit/27cddc45aeb593d1dd9a1c693d5bfe69b6569f9a)]:
  - @blobscan/api@0.18.0
  - @blobscan/syncers@0.3.4

## 0.4.7

### Patch Changes

- Updated dependencies [[`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256), [`6a06872`](https://github.com/Blobscan/blobscan/commit/6a06872d13de893f821200b3541567b413916c9a)]:
  - @blobscan/api@0.17.0
  - @blobscan/env@0.1.0
  - @blobscan/syncers@0.3.3
  - @blobscan/logger@0.1.2
  - @blobscan/open-telemetry@0.0.9

## 0.4.6

### Patch Changes

- Updated dependencies [[`025484b`](https://github.com/Blobscan/blobscan/commit/025484be6b12344cfa5a40cda963827aa60cb1e3), [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`ca30a0f`](https://github.com/Blobscan/blobscan/commit/ca30a0f03c11dfc0c4a25d18fdde2365458b17ca), [`ca30a0f`](https://github.com/Blobscan/blobscan/commit/ca30a0f03c11dfc0c4a25d18fdde2365458b17ca)]:
  - @blobscan/api@0.16.0
  - @blobscan/syncers@0.3.2

## 0.4.5

### Patch Changes

- Updated dependencies [[`76bd799`](https://github.com/Blobscan/blobscan/commit/76bd7990ea36b2826924cdbec6ddc660e96b1a17)]:
  - @blobscan/api@0.15.0

## 0.4.4

### Patch Changes

- Updated dependencies [[`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc), [`dd75d56`](https://github.com/Blobscan/blobscan/commit/dd75d56d8ce2ef881c55ac843d9e9937939d671b)]:
  - @blobscan/api@0.14.0
  - @blobscan/syncers@0.3.1

## 0.4.3

### Patch Changes

- Updated dependencies [[`7240bba`](https://github.com/Blobscan/blobscan/commit/7240bba44dfa65d208cd027d723d9fb7a2f988f7), [`c6dba39`](https://github.com/Blobscan/blobscan/commit/c6dba39665ce1df135d1f4b6ae2a324a936370b3), [`dc3afe7`](https://github.com/Blobscan/blobscan/commit/dc3afe795cebba83d7637f4c2866aafbcf009309), [`4bc7884`](https://github.com/Blobscan/blobscan/commit/4bc78848b57d2c2cfe6053a34ec2bc3e85cacfcf), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`bbf5111`](https://github.com/Blobscan/blobscan/commit/bbf5111afe84d70ada171de191f7095d2af518da), [`a84b544`](https://github.com/Blobscan/blobscan/commit/a84b5443b32e5a5cea76cedb2ba50c11742f24a7), [`bd8a4cb`](https://github.com/Blobscan/blobscan/commit/bd8a4cbb0840780b95c48fbdcaa68c711242558d), [`03fb6b0`](https://github.com/Blobscan/blobscan/commit/03fb6b0d3291a85e80cbdab6cb497b782b17e7e8), [`3507a88`](https://github.com/Blobscan/blobscan/commit/3507a88edc5a9648664fba59f78481ecdc4ca77b), [`6eb69e8`](https://github.com/Blobscan/blobscan/commit/6eb69e8c6ba1450519b13c12255749fd36c62bee)]:
  - @blobscan/api@0.13.0
  - @blobscan/syncers@0.3.0

## 0.4.2

### Patch Changes

- Updated dependencies [[`8d27043`](https://github.com/Blobscan/blobscan/commit/8d27043ea464c34cfeef29ae996fca0ee6d2c1ab), [`634274b`](https://github.com/Blobscan/blobscan/commit/634274bd0940f081d8faa54fd68a892e450ae7ad)]:
  - @blobscan/api@0.12.0
  - @blobscan/syncers@0.2.1

## 0.4.1

### Patch Changes

- Updated dependencies [[`f86465f`](https://github.com/Blobscan/blobscan/commit/f86465f88fb46150b5fbf7623a9d7242c06490c2), [`28a9642`](https://github.com/Blobscan/blobscan/commit/28a96423215afdfeb89850d2ebcb17180f3ff7c4)]:
  - @blobscan/api@0.11.0

## 0.4.0

### Minor Changes

- [#411](https://github.com/Blobscan/blobscan/pull/411) [`e74971f`](https://github.com/Blobscan/blobscan/commit/e74971f8cf198d33d62b41451d3dc096e66070ae) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added Swarm stamp syncer

- [#411](https://github.com/Blobscan/blobscan/pull/411) [`3393953`](https://github.com/Blobscan/blobscan/commit/33939533cf153b8caefff1b70c6dca5a6fe5c53b) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Refactored the stats syncer package to support general-purpose synchronization workers/queues.

  Key changes include:

      •	Renamed the package to syncers.
      •	Exported each syncer directly, removing the StatsSyncer managing entity.

### Patch Changes

- [#412](https://github.com/Blobscan/blobscan/pull/412) [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Replaced local environment variables with the `@blobscan/env` package

- Updated dependencies [[`a00fdbb`](https://github.com/Blobscan/blobscan/commit/a00fdbb08a5d17a07e7a4f759572fd598ccf7ce7), [`fb9c084`](https://github.com/Blobscan/blobscan/commit/fb9c08409ff43f2be14197bf0db9f5a2d2965ee9), [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`89d80a8`](https://github.com/Blobscan/blobscan/commit/89d80a83257659074c6e3da2e4dfb0f87842a5b8), [`3393953`](https://github.com/Blobscan/blobscan/commit/33939533cf153b8caefff1b70c6dca5a6fe5c53b), [`e2bc7cc`](https://github.com/Blobscan/blobscan/commit/e2bc7ccb0cedf74fd1811f6ba76f672d67218e84), [`097f5d5`](https://github.com/Blobscan/blobscan/commit/097f5d5be60a2bfb82faf8731e1901144abf125a)]:
  - @blobscan/api@0.10.0
  - @blobscan/syncers@0.2.0
  - @blobscan/open-telemetry@0.0.8
  - @blobscan/logger@0.1.1

## 0.3.9

### Patch Changes

- Updated dependencies [[`9d2e6ac`](https://github.com/Blobscan/blobscan/commit/9d2e6aca545a3dde9be5742afbe71b12d675420c)]:
  - @blobscan/api@0.9.0
  - @blobscan/stats-syncer@0.1.8

## 0.3.8

### Patch Changes

- [#395](https://github.com/Blobscan/blobscan/pull/395) [`c928ae0`](https://github.com/Blobscan/blobscan/commit/c928ae0ef914944c4dc3c27b0b7b4e725a92bcfd) Thanks [@PJColombo](https://github.com/PJColombo)! - Used custom logger

- Updated dependencies [[`0a61aec`](https://github.com/Blobscan/blobscan/commit/0a61aec545fa1b3b7a44b2a7c9e9a8e8250c1362), [`b1141b1`](https://github.com/Blobscan/blobscan/commit/b1141b1ca369ee8c3d02c4cb3dd4e47ebca08120), [`72e4b96`](https://github.com/Blobscan/blobscan/commit/72e4b963e2e735156032467554e6cc3cd311097e), [`737272d`](https://github.com/Blobscan/blobscan/commit/737272d6312bd478b1662133b875b50457694f10), [`ffbb8e6`](https://github.com/Blobscan/blobscan/commit/ffbb8e6074878e30c9aa5ac8e774dbbb8060fb96), [`7bb6f49`](https://github.com/Blobscan/blobscan/commit/7bb6f4912c89d0dd436e325677c801200e32edba), [`57723f3`](https://github.com/Blobscan/blobscan/commit/57723f351f4a63a5b86558e447ee5d6fe2f947c8), [`514784a`](https://github.com/Blobscan/blobscan/commit/514784a743937dc2d1af1ed533e90fef3b3aa057), [`1cce838`](https://github.com/Blobscan/blobscan/commit/1cce8387e28488946b83c5a8a36a2e0db1d595c9), [`5ffb8ca`](https://github.com/Blobscan/blobscan/commit/5ffb8ca355bfcd02393a3b40e89b9d7a1a5a05e8), [`d7a760d`](https://github.com/Blobscan/blobscan/commit/d7a760da302ce01f1f6f1072d98a10cc100dc1f5)]:
  - @blobscan/logger@0.1.0
  - @blobscan/zod@0.1.0
  - @blobscan/api@0.8.1
  - @blobscan/open-telemetry@0.0.7
  - @blobscan/stats-syncer@0.1.7

## 0.3.7

### Patch Changes

- [#367](https://github.com/Blobscan/blobscan/pull/367) [`d185c88`](https://github.com/Blobscan/blobscan/commit/d185c88ac2d757ab621e88797f5a8bf644b99072) Thanks [@PJColombo](https://github.com/PJColombo)! - Set up sentry

- Updated dependencies [[`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8)]:
  - @blobscan/api@0.8.0
  - @blobscan/stats-syncer@0.1.6

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

- [#295](https://github.com/Blobscan/blobscan/pull/295) [`b307c59`](https://github.com/Blobscan/blobscan/commit/b307c59cace1858634b0bf54099338429c69ce63) Thanks [@0xGabi](https://github.com/0xGabi)! - Split getByBlockId schema to handle openapi parse restrictions

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
