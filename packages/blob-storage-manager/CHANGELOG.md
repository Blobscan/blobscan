# @blobscan/blob-storage-manager

## 1.0.0

### Patch Changes

- Updated dependencies [[`93dbcc1`](https://github.com/Blobscan/blobscan/commit/93dbcc1f99da33132c0d8ad7f94fd16d4836c12b)]:
  - @blobscan/db@0.19.0

## 0.6.1

### Patch Changes

- [#849](https://github.com/Blobscan/blobscan/pull/849) [`d8b5340`](https://github.com/Blobscan/blobscan/commit/d8b53406065211ddda568eb9b20204306e30fcc0) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved an issue where the blob data being fetched by the swarm storage wasn't being prefixed with `0x` when converting it to hex

## 0.6.0

### Minor Changes

- [#829](https://github.com/Blobscan/blobscan/pull/829) [`d579a78`](https://github.com/Blobscan/blobscan/commit/d579a788f6baa152ffca3344fc5207ecd2d104a4) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Add support for S3_STORAGE_FORCE_PATH_STYLE environment variable

- [#820](https://github.com/Blobscan/blobscan/pull/820) [`f64d961`](https://github.com/Blobscan/blobscan/commit/f64d961a166cc6fe4ae9397d2d54b24c3764f13d) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added AWS S3 blob storage

- [#831](https://github.com/Blobscan/blobscan/pull/831) [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed exposed singleton instance of Blob Storage Manager; consumers must now instantiate it manually

- [#829](https://github.com/Blobscan/blobscan/pull/829) [`d579a78`](https://github.com/Blobscan/blobscan/commit/d579a788f6baa152ffca3344fc5207ecd2d104a4) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Changed default behavior to make uploaded S3 files publicly accessible.

### Patch Changes

- Updated dependencies [[`52b89d6`](https://github.com/Blobscan/blobscan/commit/52b89d6a90200eea5647c49bb5fba8c0b0ff1529)]:
  - @blobscan/env@0.2.0
  - @blobscan/db@0.18.1
  - @blobscan/logger@0.1.3
  - @blobscan/open-telemetry@0.0.10

## 0.5.1

### Patch Changes

- [#804](https://github.com/Blobscan/blobscan/pull/804) [`926bd56`](https://github.com/Blobscan/blobscan/commit/926bd56a3b3bfd2deec6402a6f22b183623a8cbe) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Store blob data as `.bin` files instead of .txt to reduce storage footprint and improve efficiency.

- [#804](https://github.com/Blobscan/blobscan/pull/804) [`926bd56`](https://github.com/Blobscan/blobscan/commit/926bd56a3b3bfd2deec6402a6f22b183623a8cbe) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Checked blob data URI extension (`.txt` or `.bin`) and parsed the content accordingly

## 0.5.0

### Minor Changes

- [#793](https://github.com/Blobscan/blobscan/pull/793) [`ec6f24f`](https://github.com/Blobscan/blobscan/commit/ec6f24f9a24114be0fd973f30eb1d67b683e0f73) Thanks [@xFJA](https://github.com/xFJA)! - Added to Swarm storage option to upload file using Chunkstorm"

### Patch Changes

- Updated dependencies [[`052da7e`](https://github.com/Blobscan/blobscan/commit/052da7e93a3c3289ec67097b8f8bc34315d84b2e)]:
  - @blobscan/db@0.18.0

## 0.4.5

### Patch Changes

- [#783](https://github.com/Blobscan/blobscan/pull/783) [`1452221`](https://github.com/Blobscan/blobscan/commit/1452221a6ac876c558cd9e6e30e0af3bcb8d5238) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Bumped bee client

- [#783](https://github.com/Blobscan/blobscan/pull/783) [`1452221`](https://github.com/Blobscan/blobscan/commit/1452221a6ac876c558cd9e6e30e0af3bcb8d5238) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Improved Swarm storage error handling

- [#788](https://github.com/Blobscan/blobscan/pull/788) [`499c9aa`](https://github.com/Blobscan/blobscan/commit/499c9aac0d843ed5b8bb8f15983389b3898f25ee) Thanks [@PJColombo](https://github.com/PJColombo)! - Attached bee endpoint and batch id to swarm storage errors

## 0.4.4

### Patch Changes

- Updated dependencies [[`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92)]:
  - @blobscan/db@0.17.0

## 0.4.3

### Patch Changes

- Updated dependencies [[`29b205a`](https://github.com/Blobscan/blobscan/commit/29b205a0e096a7cf42f26554c2f4818c94303295)]:
  - @blobscan/db@0.16.0

## 0.4.2

### Patch Changes

- Updated dependencies [[`8e4633e`](https://github.com/Blobscan/blobscan/commit/8e4633eee4c0b736819d56ef6dc701d3df42d04d), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf)]:
  - @blobscan/db@0.15.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`242af90`](https://github.com/Blobscan/blobscan/commit/242af90b145ec95277172dc1a74ebb222231e58a)]:
  - @blobscan/db@0.14.0

## 0.4.0

### Minor Changes

- [#681](https://github.com/Blobscan/blobscan/pull/681) [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256) Thanks [@PJColombo](https://github.com/PJColombo)! - Added Weavevm blob storage support

### Patch Changes

- Updated dependencies [[`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202), [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256), [`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202)]:
  - @blobscan/db@0.13.0
  - @blobscan/env@0.1.0
  - @blobscan/logger@0.1.2
  - @blobscan/open-telemetry@0.0.9

## 0.3.7

### Patch Changes

- Updated dependencies [[`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea), [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea)]:
  - @blobscan/db@0.12.0

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

- [#388](https://github.com/Blobscan/blobscan/pull/388) [`40824c2`](https://github.com/Blobscan/blobscan/commit/40824c26f6d8a360592c812bd1afe505d9fc4f6d) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Decoupled blob storage creation from environment variables

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
