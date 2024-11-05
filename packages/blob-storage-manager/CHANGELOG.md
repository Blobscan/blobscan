# @blobscan/blob-storage-manager

## 0.3.6

### Patch Changes

- Updated dependencies [[`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc)]:
  - @blobscan/db@0.11.0

## 0.3.5

### Patch Changes

- Updated dependencies [[`7240bba`](https://github.com/Blobscan/blobscan/commit/7240bba44dfa65d208cd027d723d9fb7a2f988f7), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`6eb69e8`](https://github.com/Blobscan/blobscan/commit/6eb69e8c6ba1450519b13c12255749fd36c62bee), [`3507a88`](https://github.com/Blobscan/blobscan/commit/3507a88edc5a9648664fba59f78481ecdc4ca77b)]:
  - @blobscan/db@0.10.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7), [`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7)]:
  - @blobscan/db@0.9.0

## 0.3.3

### Patch Changes

- [#412](https://github.com/Blobscan/blobscan/pull/412) [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Replaced local environment variables with the `@blobscan/env` package

- [#410](https://github.com/Blobscan/blobscan/pull/410) [`28da372`](https://github.com/Blobscan/blobscan/commit/28da372f217ce44cb7e16cd02bcc02633576879a) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Dropped bee debug client

- Updated dependencies [[`a00fdbb`](https://github.com/Blobscan/blobscan/commit/a00fdbb08a5d17a07e7a4f759572fd598ccf7ce7), [`3e15dd1`](https://github.com/Blobscan/blobscan/commit/3e15dd1bc074cde951aedf307fdbdb668bcc081b), [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`cd96277`](https://github.com/Blobscan/blobscan/commit/cd96277acf3a2e25f6ca1332fc66283cfd95f673), [`363a5aa`](https://github.com/Blobscan/blobscan/commit/363a5aae45e087b8938325a472e2c1c1dcfde42d), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`e2bc7cc`](https://github.com/Blobscan/blobscan/commit/e2bc7ccb0cedf74fd1811f6ba76f672d67218e84), [`097f5d5`](https://github.com/Blobscan/blobscan/commit/097f5d5be60a2bfb82faf8731e1901144abf125a)]:
  - @blobscan/db@0.8.0
  - @blobscan/open-telemetry@0.0.8
  - @blobscan/logger@0.1.1

## 0.3.2

### Patch Changes

- Updated dependencies [[`4ff5c4d`](https://github.com/Blobscan/blobscan/commit/4ff5c4d720463fd607a32fe35466a3e0dad045f9)]:
  - @blobscan/db@0.7.0

## 0.3.1

### Patch Changes

- [#399](https://github.com/Blobscan/blobscan/pull/399) [`fad721d`](https://github.com/Blobscan/blobscan/commit/fad721de28cb131ed988a1f2333d7b35e8261df2) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed file system storage issue where blob removal operation was throwing error if the blob path didn't exists

- [`c4c94f4`](https://github.com/Blobscan/blobscan/commit/c4c94f453146beefe853dfedf8681db472155c34) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed a postgres storage issue where the existence of a blob wasn't checked before removal

- [#399](https://github.com/Blobscan/blobscan/pull/399) [`fad721d`](https://github.com/Blobscan/blobscan/commit/fad721de28cb131ed988a1f2333d7b35e8261df2) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed file system storage issue where files and directories were not being created with the correct full permissions

- [`4aa1198`](https://github.com/Blobscan/blobscan/commit/4aa1198d2f3d4387f9cabb2b791a7a2b8b863938) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed google storage issue where the existence of a blob wasn't being checked properly before removal

- Updated dependencies [[`9d2e6ac`](https://github.com/Blobscan/blobscan/commit/9d2e6aca545a3dde9be5742afbe71b12d675420c)]:
  - @blobscan/db@0.6.0

## 0.3.0

### Minor Changes

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`67a7472`](https://github.com/Blobscan/blobscan/commit/67a7472e14e4488a9425016e11fd52f963b570ef) Thanks [@PJColombo](https://github.com/PJColombo)! - Allowed to add and remove storages to/from the blob storage manager after instantiation

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`ba066e0`](https://github.com/Blobscan/blobscan/commit/ba066e0db6b19ae1056ecc17c3b42acc64627a7f) Thanks [@PJColombo](https://github.com/PJColombo)! - Added blob removal logic to blob storages

- [#388](https://github.com/Blobscan/blobscan/pull/388) [`40824c2`](https://github.com/Blobscan/blobscan/commit/40824c26f6d8a360592c812bd1afe505d9fc4f6d) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Retrieved swarm storage batch ID from database

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`a5bc257`](https://github.com/Blobscan/blobscan/commit/a5bc257090fd6c832b3379b56281c82db5936a01) Thanks [@PJColombo](https://github.com/PJColombo)! - Exported create storage from env vars function

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`d7a760d`](https://github.com/Blobscan/blobscan/commit/d7a760da302ce01f1f6f1072d98a10cc100dc1f5) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for retrieving blob data by hash in addition to by its references.

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`db1d90a`](https://github.com/Blobscan/blobscan/commit/db1d90a95ebd633620c667d96c42a6a2ea6ef814) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed the option to select specific storages when storing a blob.

### Patch Changes

- [#379](https://github.com/Blobscan/blobscan/pull/379) [`db42b53`](https://github.com/Blobscan/blobscan/commit/db42b539582d2b9a19339bd3b9b610d5d90b71b9) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Bumped bee client version to use non-deferred uploads

- [#388](https://github.com/Blobscan/blobscan/pull/388) [`40824c2`](https://github.com/Blobscan/blobscan/commit/40824c26f6d8a360592c812bd1afe505d9fc4f6d) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Decoupled blob storage creation from enviroment variables

- Updated dependencies [[`0a61aec`](https://github.com/Blobscan/blobscan/commit/0a61aec545fa1b3b7a44b2a7c9e9a8e8250c1362), [`b1141b1`](https://github.com/Blobscan/blobscan/commit/b1141b1ca369ee8c3d02c4cb3dd4e47ebca08120), [`72e4b96`](https://github.com/Blobscan/blobscan/commit/72e4b963e2e735156032467554e6cc3cd311097e), [`7bb6f49`](https://github.com/Blobscan/blobscan/commit/7bb6f4912c89d0dd436e325677c801200e32edba), [`514784a`](https://github.com/Blobscan/blobscan/commit/514784a743937dc2d1af1ed533e90fef3b3aa057), [`5ffb8ca`](https://github.com/Blobscan/blobscan/commit/5ffb8ca355bfcd02393a3b40e89b9d7a1a5a05e8), [`89df217`](https://github.com/Blobscan/blobscan/commit/89df217e817727a710a7c3217ad7be4750de93ce), [`b4e8d2c`](https://github.com/Blobscan/blobscan/commit/b4e8d2cd63d4f2b307f21848c23da14acc265ab0)]:
  - @blobscan/logger@0.1.0
  - @blobscan/zod@0.1.0
  - @blobscan/db@0.5.0
  - @blobscan/open-telemetry@0.0.7

## 0.2.0

### Minor Changes

- [#358](https://github.com/Blobscan/blobscan/pull/358) [`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8) Thanks [@PJColombo](https://github.com/PJColombo)! - Added file system blob storage

### Patch Changes

- [#358](https://github.com/Blobscan/blobscan/pull/358) [`b50d0be`](https://github.com/Blobscan/blobscan/commit/b50d0be3ca660eb8d0c46df2e6f3b9d5d212b4b4) Thanks [@PJColombo](https://github.com/PJColombo)! - Updated blob storages initialization to use chain ID directly

- Updated dependencies [[`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8)]:
  - @blobscan/db@0.4.0

## 0.1.0

### Minor Changes

- [#355](https://github.com/Blobscan/blobscan/pull/355) [`37539a6`](https://github.com/Blobscan/blobscan/commit/37539a6881e1cffe2cd3e7ef6f1686e6d6f39bd7) Thanks [@0xGabi](https://github.com/0xGabi)! - Added new procedure to fetch swarm state

## 0.0.8

### Patch Changes

- [#353](https://github.com/Blobscan/blobscan/pull/353) [`fc6298f`](https://github.com/Blobscan/blobscan/commit/fc6298fcbdc17b89bd0289ddd1f8d252870cd402) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed swarm storage blob data decoding

## 0.0.7

### Patch Changes

- [#265](https://github.com/Blobscan/blobscan/pull/265) [`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5) Thanks [@PJColombo](https://github.com/PJColombo)! - Updated blob storage creation to warn on failure, avoiding direct exception throws

- [#265](https://github.com/Blobscan/blobscan/pull/265) [`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5) Thanks [@PJColombo](https://github.com/PJColombo)! - Simplified blob storage manager initialization by accepting an array of blob storages instead of an object

- [#265](https://github.com/Blobscan/blobscan/pull/265) [`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5) Thanks [@PJColombo](https://github.com/PJColombo)! - Added custom blob storage manager errors

- Updated dependencies [[`cafdf6f`](https://github.com/Blobscan/blobscan/commit/cafdf6f5421f50ae0b88ea2563933f14e3db9d76)]:
  - @blobscan/logger@0.0.6
  - @blobscan/db@0.3.1
  - @blobscan/open-telemetry@0.0.6

## 0.0.6

### Patch Changes

- Updated dependencies [[`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167)]:
  - @blobscan/db@0.3.0

## 0.0.5

### Patch Changes

- Updated dependencies [[`04bfb3c`](https://github.com/Blobscan/blobscan/commit/04bfb3cc78ce76f5e08cca1063f33bd6714b7096)]:
  - @blobscan/logger@0.0.5
  - @blobscan/db@0.2.1
  - @blobscan/open-telemetry@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies [[`3c09b5b`](https://github.com/Blobscan/blobscan/commit/3c09b5bf8ea854f30a6675b022a87b1a04960bf6), [`1ea0023`](https://github.com/Blobscan/blobscan/commit/1ea0023cdfdba270d0cadb307f8799baa75af414)]:
  - @blobscan/zod@0.0.4
  - @blobscan/db@0.2.0
  - @blobscan/logger@0.0.4
  - @blobscan/open-telemetry@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies [[`411023b`](https://github.com/Blobscan/blobscan/commit/411023b92abe25f21e06e4084faca43cde0f41c3), [`a39efaf`](https://github.com/Blobscan/blobscan/commit/a39efafec2732d0ceced9f97fc0d538cf7b0c922), [`0c937dc`](https://github.com/Blobscan/blobscan/commit/0c937dc29f1fec3e9390179f0ae37559ba5ce6c3), [`824ccc0`](https://github.com/Blobscan/blobscan/commit/824ccc01ef8c533dcf5ed8d9cd1b5f9ce30ed145)]:
  - @blobscan/db@0.1.1
  - @blobscan/zod@0.0.3
  - @blobscan/logger@0.0.3
  - @blobscan/open-telemetry@0.0.3

## 0.0.2

### Patch Changes

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset

- Updated dependencies [[`71887f8`](https://github.com/Blobscan/blobscan/commit/71887f8dc09b45b0cb0748c0d6e8ddce2662f34d), [`2bce443`](https://github.com/Blobscan/blobscan/commit/2bce443401b1875df40298ebd957f86a92539397), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73), [`acf8dff`](https://github.com/Blobscan/blobscan/commit/acf8dff07d62a33d5dfa3789fd1f4e2aa3e968a3), [`263d86f`](https://github.com/Blobscan/blobscan/commit/263d86ff5e35f7cf9d5bf18f6b745f8dd6249e62), [`cb732e7`](https://github.com/Blobscan/blobscan/commit/cb732e7febcbc05bdec2221fec1213bcb8172717), [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a), [`5ed5186`](https://github.com/Blobscan/blobscan/commit/5ed51867d5b01b0572bfa69f3211a5b5bfaf254e)]:
  - @blobscan/db@0.1.0
  - @blobscan/logger@0.0.2
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/zod@0.0.2
