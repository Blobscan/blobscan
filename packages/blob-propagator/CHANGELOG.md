# @blobscan/blob-propagator

## 0.6.1

### Patch Changes

- Updated dependencies [[`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b)]:
  - @blobscan/db@0.22.0
  - @blobscan/blob-storage-manager@0.7.0

## 0.6.0

### Minor Changes

- [#889](https://github.com/Blobscan/blobscan/pull/889) [`64ac4eb`](https://github.com/Blobscan/blobscan/commit/64ac4eb9a5b832e8b68c580c179d1c83f291f6cc) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for toggling reconciler

## 0.5.1

### Patch Changes

- [#886](https://github.com/Blobscan/blobscan/pull/886) [`427cf7e`](https://github.com/Blobscan/blobscan/commit/427cf7e78a79216fbba04d6e8453d1b38837ab56) Thanks [@PJColombo](https://github.com/PJColombo)! - Skipped unsupported blob storages instead of throwing errors when creating blob propagator

- [#884](https://github.com/Blobscan/blobscan/pull/884) [`53881e0`](https://github.com/Blobscan/blobscan/commit/53881e0ff6e9f371e861395170f61622c9aa06dc) Thanks [@PJColombo](https://github.com/PJColombo)! - Bubbled up blob propagator creation errors

## 0.5.0

### Minor Changes

- [#876](https://github.com/Blobscan/blobscan/pull/876) [`242ac1e`](https://github.com/Blobscan/blobscan/commit/242ac1e782cdb13b1867e199eb8c6c5f1a4d5dad) Thanks [@PJColombo](https://github.com/PJColombo)! - Added a new worker to the blob propagator (reconciler) that periodically scans for orphaned blobs (not propagated to any storage) and re-creates propagation jobs to retry propagation.

- [#876](https://github.com/Blobscan/blobscan/pull/876) [`242ac1e`](https://github.com/Blobscan/blobscan/commit/242ac1e782cdb13b1867e199eb8c6c5f1a4d5dad) Thanks [@PJColombo](https://github.com/PJColombo)! - Introduced primary blob storage

- [#876](https://github.com/Blobscan/blobscan/pull/876) [`242ac1e`](https://github.com/Blobscan/blobscan/commit/242ac1e782cdb13b1867e199eb8c6c5f1a4d5dad) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed flow jobs and finalizer queue

### Patch Changes

- Updated dependencies [[`3fe35fe`](https://github.com/Blobscan/blobscan/commit/3fe35fe61eb3d2bae5f37e79b9a3921c7e59ba5a)]:
  - @blobscan/db@0.21.0
  - @blobscan/blob-storage-manager@0.6.4

## 0.4.2

### Patch Changes

- Updated dependencies [[`77437ef`](https://github.com/Blobscan/blobscan/commit/77437ef5b3cfd26dfed0becd7d6f313373f8e4f4)]:
  - @blobscan/db@0.20.0
  - @blobscan/blob-storage-manager@0.6.3

## 0.4.1

### Patch Changes

- Updated dependencies [[`93dbcc1`](https://github.com/Blobscan/blobscan/commit/93dbcc1f99da33132c0d8ad7f94fd16d4836c12b)]:
  - @blobscan/db@0.19.0
  - @blobscan/blob-storage-manager@0.6.2

## 0.4.0

### Minor Changes

- [#837](https://github.com/Blobscan/blobscan/pull/837) [`3518952`](https://github.com/Blobscan/blobscan/commit/3518952f41d9c0a221e30c33a58578dde6fd1ed9) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for prioritizing blob propagation jobs

## 0.3.0

### Minor Changes

- [#831](https://github.com/Blobscan/blobscan/pull/831) [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed exposed singleton instance of Blob Propagator; consumers must now instantiate it manually

- [#820](https://github.com/Blobscan/blobscan/pull/820) [`f64d961`](https://github.com/Blobscan/blobscan/commit/f64d961a166cc6fe4ae9397d2d54b24c3764f13d) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added AWS S3 blob storage

- [#833](https://github.com/Blobscan/blobscan/pull/833) [`52b89d6`](https://github.com/Blobscan/blobscan/commit/52b89d6a90200eea5647c49bb5fba8c0b0ff1529) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for configurating blob retention mode on blob propagator

### Patch Changes

- Updated dependencies [[`d579a78`](https://github.com/Blobscan/blobscan/commit/d579a788f6baa152ffca3344fc5207ecd2d104a4), [`f64d961`](https://github.com/Blobscan/blobscan/commit/f64d961a166cc6fe4ae9397d2d54b24c3764f13d), [`52b89d6`](https://github.com/Blobscan/blobscan/commit/52b89d6a90200eea5647c49bb5fba8c0b0ff1529), [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e), [`d579a78`](https://github.com/Blobscan/blobscan/commit/d579a788f6baa152ffca3344fc5207ecd2d104a4)]:
  - @blobscan/blob-storage-manager@0.6.0
  - @blobscan/env@0.2.0
  - @blobscan/db@0.18.1
  - @blobscan/logger@0.1.3
  - @blobscan/open-telemetry@0.0.10

## 0.2.13

### Patch Changes

- Updated dependencies [[`ec6f24f`](https://github.com/Blobscan/blobscan/commit/ec6f24f9a24114be0fd973f30eb1d67b683e0f73), [`052da7e`](https://github.com/Blobscan/blobscan/commit/052da7e93a3c3289ec67097b8f8bc34315d84b2e)]:
  - @blobscan/blob-storage-manager@0.5.0
  - @blobscan/db@0.18.0

## 0.2.12

### Patch Changes

- Updated dependencies [[`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92)]:
  - @blobscan/db@0.17.0
  - @blobscan/blob-storage-manager@0.4.4

## 0.2.11

### Patch Changes

- Updated dependencies [[`29b205a`](https://github.com/Blobscan/blobscan/commit/29b205a0e096a7cf42f26554c2f4818c94303295)]:
  - @blobscan/db@0.16.0
  - @blobscan/blob-storage-manager@0.4.3

## 0.2.10

### Patch Changes

- Updated dependencies [[`8e4633e`](https://github.com/Blobscan/blobscan/commit/8e4633eee4c0b736819d56ef6dc701d3df42d04d), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf)]:
  - @blobscan/db@0.15.0
  - @blobscan/blob-storage-manager@0.4.2

## 0.2.9

### Patch Changes

- Updated dependencies [[`242af90`](https://github.com/Blobscan/blobscan/commit/242af90b145ec95277172dc1a74ebb222231e58a)]:
  - @blobscan/db@0.14.0
  - @blobscan/blob-storage-manager@0.4.1

## 0.2.8

### Patch Changes

- Updated dependencies [[`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202), [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256), [`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202)]:
  - @blobscan/db@0.13.0
  - @blobscan/blob-storage-manager@0.4.0
  - @blobscan/env@0.1.0
  - @blobscan/logger@0.1.2
  - @blobscan/open-telemetry@0.0.9

## 0.2.7

### Patch Changes

- [#628](https://github.com/Blobscan/blobscan/pull/628) [`6512745`](https://github.com/Blobscan/blobscan/commit/6512745dc20949837a37aa923766f8b7effd6816) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Removed `BLOB_PROPAGATOR_ENABLED` variable.

- Updated dependencies [[`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea), [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea)]:
  - @blobscan/db@0.12.0
  - @blobscan/blob-storage-manager@0.3.7

## 0.2.6

### Patch Changes

- Updated dependencies [[`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc)]:
  - @blobscan/db@0.11.0
  - @blobscan/blob-storage-manager@0.3.6

## 0.2.5

### Patch Changes

- Updated dependencies [[`7240bba`](https://github.com/Blobscan/blobscan/commit/7240bba44dfa65d208cd027d723d9fb7a2f988f7), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`6eb69e8`](https://github.com/Blobscan/blobscan/commit/6eb69e8c6ba1450519b13c12255749fd36c62bee), [`3507a88`](https://github.com/Blobscan/blobscan/commit/3507a88edc5a9648664fba59f78481ecdc4ca77b)]:
  - @blobscan/db@0.10.0
  - @blobscan/blob-storage-manager@0.3.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7), [`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7)]:
  - @blobscan/db@0.9.0
  - @blobscan/blob-storage-manager@0.3.4

## 0.2.3

### Patch Changes

- [#412](https://github.com/Blobscan/blobscan/pull/412) [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Replaced local environment variables with the `@blobscan/env` package

- Updated dependencies [[`a00fdbb`](https://github.com/Blobscan/blobscan/commit/a00fdbb08a5d17a07e7a4f759572fd598ccf7ce7), [`3e15dd1`](https://github.com/Blobscan/blobscan/commit/3e15dd1bc074cde951aedf307fdbdb668bcc081b), [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735), [`28da372`](https://github.com/Blobscan/blobscan/commit/28da372f217ce44cb7e16cd02bcc02633576879a), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`cd96277`](https://github.com/Blobscan/blobscan/commit/cd96277acf3a2e25f6ca1332fc66283cfd95f673), [`363a5aa`](https://github.com/Blobscan/blobscan/commit/363a5aae45e087b8938325a472e2c1c1dcfde42d), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`e2bc7cc`](https://github.com/Blobscan/blobscan/commit/e2bc7ccb0cedf74fd1811f6ba76f672d67218e84), [`097f5d5`](https://github.com/Blobscan/blobscan/commit/097f5d5be60a2bfb82faf8731e1901144abf125a)]:
  - @blobscan/db@0.8.0
  - @blobscan/blob-storage-manager@0.3.3
  - @blobscan/open-telemetry@0.0.8
  - @blobscan/logger@0.1.1

## 0.2.2

### Patch Changes

- Updated dependencies [[`4ff5c4d`](https://github.com/Blobscan/blobscan/commit/4ff5c4d720463fd607a32fe35466a3e0dad045f9)]:
  - @blobscan/db@0.7.0
  - @blobscan/blob-storage-manager@0.3.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`9d2e6ac`](https://github.com/Blobscan/blobscan/commit/9d2e6aca545a3dde9be5742afbe71b12d675420c), [`fad721d`](https://github.com/Blobscan/blobscan/commit/fad721de28cb131ed988a1f2333d7b35e8261df2), [`c4c94f4`](https://github.com/Blobscan/blobscan/commit/c4c94f453146beefe853dfedf8681db472155c34), [`fad721d`](https://github.com/Blobscan/blobscan/commit/fad721de28cb131ed988a1f2333d7b35e8261df2), [`4aa1198`](https://github.com/Blobscan/blobscan/commit/4aa1198d2f3d4387f9cabb2b791a7a2b8b863938)]:
  - @blobscan/db@0.6.0
  - @blobscan/blob-storage-manager@0.3.1

## 0.2.0

### Minor Changes

- [#395](https://github.com/Blobscan/blobscan/pull/395) [`7c95fdd`](https://github.com/Blobscan/blobscan/commit/7c95fddb50e4939844a933ded836916792e07323) Thanks [@PJColombo](https://github.com/PJColombo)! - Added custom errors

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`d42f1a9`](https://github.com/Blobscan/blobscan/commit/d42f1a9e7dffc5a204c067251947db25cdbc3cf1) Thanks [@PJColombo](https://github.com/PJColombo)! - - Replaced blob file manager for file system storage
  - Allowed to configure temporary blob storage
  - Updated storage worker logic to retrieve blob to propagated from any of the storages and not only the temporary

### Patch Changes

- [#395](https://github.com/Blobscan/blobscan/pull/395) [`52804b1`](https://github.com/Blobscan/blobscan/commit/52804b1a71c645242719230b3d68240b6a30687a) Thanks [@PJColombo](https://github.com/PJColombo)! - Used custom logger

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`95fbf74`](https://github.com/Blobscan/blobscan/commit/95fbf7471f5e5cacec7513f0736a70a18f971ce1) Thanks [@PJColombo](https://github.com/PJColombo)! - Allowed to remove storage jobs from finalizer queue dependencies if they fail

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`d7a760d`](https://github.com/Blobscan/blobscan/commit/d7a760da302ce01f1f6f1072d98a10cc100dc1f5) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for retrieving blob data by hash in addition to by its references.

- [#380](https://github.com/Blobscan/blobscan/pull/380) [`7e2d4d0`](https://github.com/Blobscan/blobscan/commit/7e2d4d0f601127c00ade2f01e4936579463230fd) Thanks [@PJColombo](https://github.com/PJColombo)! - Filtered out duplicated blobs when propagating multiple blobs

- [#388](https://github.com/Blobscan/blobscan/pull/388) [`40824c2`](https://github.com/Blobscan/blobscan/commit/40824c26f6d8a360592c812bd1afe505d9fc4f6d) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Decoupled blob storage creation from environment variables

- [`0570eee`](https://github.com/Blobscan/blobscan/commit/0570eee9a4d30f5c07cef177ba79cd1798992761) Thanks [@PJColombo](https://github.com/PJColombo)! - Allowed to configure blob propagation jobs lifetime

- Updated dependencies [[`0a61aec`](https://github.com/Blobscan/blobscan/commit/0a61aec545fa1b3b7a44b2a7c9e9a8e8250c1362), [`67a7472`](https://github.com/Blobscan/blobscan/commit/67a7472e14e4488a9425016e11fd52f963b570ef), [`b1141b1`](https://github.com/Blobscan/blobscan/commit/b1141b1ca369ee8c3d02c4cb3dd4e47ebca08120), [`72e4b96`](https://github.com/Blobscan/blobscan/commit/72e4b963e2e735156032467554e6cc3cd311097e), [`ba066e0`](https://github.com/Blobscan/blobscan/commit/ba066e0db6b19ae1056ecc17c3b42acc64627a7f), [`40824c2`](https://github.com/Blobscan/blobscan/commit/40824c26f6d8a360592c812bd1afe505d9fc4f6d), [`7bb6f49`](https://github.com/Blobscan/blobscan/commit/7bb6f4912c89d0dd436e325677c801200e32edba), [`514784a`](https://github.com/Blobscan/blobscan/commit/514784a743937dc2d1af1ed533e90fef3b3aa057), [`a5bc257`](https://github.com/Blobscan/blobscan/commit/a5bc257090fd6c832b3379b56281c82db5936a01), [`5ffb8ca`](https://github.com/Blobscan/blobscan/commit/5ffb8ca355bfcd02393a3b40e89b9d7a1a5a05e8), [`89df217`](https://github.com/Blobscan/blobscan/commit/89df217e817727a710a7c3217ad7be4750de93ce), [`d7a760d`](https://github.com/Blobscan/blobscan/commit/d7a760da302ce01f1f6f1072d98a10cc100dc1f5), [`db1d90a`](https://github.com/Blobscan/blobscan/commit/db1d90a95ebd633620c667d96c42a6a2ea6ef814), [`db42b53`](https://github.com/Blobscan/blobscan/commit/db42b539582d2b9a19339bd3b9b610d5d90b71b9), [`40824c2`](https://github.com/Blobscan/blobscan/commit/40824c26f6d8a360592c812bd1afe505d9fc4f6d), [`b4e8d2c`](https://github.com/Blobscan/blobscan/commit/b4e8d2cd63d4f2b307f21848c23da14acc265ab0)]:
  - @blobscan/logger@0.1.0
  - @blobscan/blob-storage-manager@0.3.0
  - @blobscan/zod@0.1.0
  - @blobscan/db@0.5.0
  - @blobscan/open-telemetry@0.0.7

## 0.1.0

### Minor Changes

- [#358](https://github.com/Blobscan/blobscan/pull/358) [`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8) Thanks [@PJColombo](https://github.com/PJColombo)! - Added file system blob storage

### Patch Changes

- Updated dependencies [[`b50d0be`](https://github.com/Blobscan/blobscan/commit/b50d0be3ca660eb8d0c46df2e6f3b9d5d212b4b4), [`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8)]:
  - @blobscan/blob-storage-manager@0.2.0
  - @blobscan/db@0.4.0

## 0.0.9

### Patch Changes

- Updated dependencies [[`37539a6`](https://github.com/Blobscan/blobscan/commit/37539a6881e1cffe2cd3e7ef6f1686e6d6f39bd7)]:
  - @blobscan/blob-storage-manager@0.1.0

## 0.0.8

### Patch Changes

- Updated dependencies [[`fc6298f`](https://github.com/Blobscan/blobscan/commit/fc6298fcbdc17b89bd0289ddd1f8d252870cd402)]:
  - @blobscan/blob-storage-manager@0.0.8

## 0.0.7

### Patch Changes

- Updated dependencies [[`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5), [`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5), [`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5), [`cafdf6f`](https://github.com/Blobscan/blobscan/commit/cafdf6f5421f50ae0b88ea2563933f14e3db9d76)]:
  - @blobscan/blob-storage-manager@0.0.7
  - @blobscan/logger@0.0.6
  - @blobscan/db@0.3.1
  - @blobscan/open-telemetry@0.0.6

## 0.0.6

### Patch Changes

- Updated dependencies [[`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167)]:
  - @blobscan/db@0.3.0
  - @blobscan/blob-storage-manager@0.0.6

## 0.0.5

### Patch Changes

- Updated dependencies [[`04bfb3c`](https://github.com/Blobscan/blobscan/commit/04bfb3cc78ce76f5e08cca1063f33bd6714b7096)]:
  - @blobscan/logger@0.0.5
  - @blobscan/blob-storage-manager@0.0.5
  - @blobscan/db@0.2.1
  - @blobscan/open-telemetry@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies [[`3c09b5b`](https://github.com/Blobscan/blobscan/commit/3c09b5bf8ea854f30a6675b022a87b1a04960bf6), [`1ea0023`](https://github.com/Blobscan/blobscan/commit/1ea0023cdfdba270d0cadb307f8799baa75af414)]:
  - @blobscan/zod@0.0.4
  - @blobscan/db@0.2.0
  - @blobscan/blob-storage-manager@0.0.4
  - @blobscan/logger@0.0.4
  - @blobscan/open-telemetry@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies [[`411023b`](https://github.com/Blobscan/blobscan/commit/411023b92abe25f21e06e4084faca43cde0f41c3), [`a39efaf`](https://github.com/Blobscan/blobscan/commit/a39efafec2732d0ceced9f97fc0d538cf7b0c922), [`0c937dc`](https://github.com/Blobscan/blobscan/commit/0c937dc29f1fec3e9390179f0ae37559ba5ce6c3), [`824ccc0`](https://github.com/Blobscan/blobscan/commit/824ccc01ef8c533dcf5ed8d9cd1b5f9ce30ed145)]:
  - @blobscan/db@0.1.1
  - @blobscan/zod@0.0.3
  - @blobscan/blob-storage-manager@0.0.3
  - @blobscan/logger@0.0.3
  - @blobscan/open-telemetry@0.0.3

## 0.0.2

### Patch Changes

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset

- Updated dependencies [[`71887f8`](https://github.com/Blobscan/blobscan/commit/71887f8dc09b45b0cb0748c0d6e8ddce2662f34d), [`2bce443`](https://github.com/Blobscan/blobscan/commit/2bce443401b1875df40298ebd957f86a92539397), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73), [`acf8dff`](https://github.com/Blobscan/blobscan/commit/acf8dff07d62a33d5dfa3789fd1f4e2aa3e968a3), [`263d86f`](https://github.com/Blobscan/blobscan/commit/263d86ff5e35f7cf9d5bf18f6b745f8dd6249e62), [`cb732e7`](https://github.com/Blobscan/blobscan/commit/cb732e7febcbc05bdec2221fec1213bcb8172717), [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a), [`5ed5186`](https://github.com/Blobscan/blobscan/commit/5ed51867d5b01b0572bfa69f3211a5b5bfaf254e)]:
  - @blobscan/db@0.1.0
  - @blobscan/logger@0.0.2
  - @blobscan/blob-storage-manager@0.0.2
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/zod@0.0.2
