# @blobscan/syncers

## 0.6.4

### Patch Changes

- Updated dependencies [[`fea097f`](https://github.com/Blobscan/blobscan/commit/fea097f1ba88dae6639a93f975a19dea7ce16107)]:
  - @blobscan/db@0.26.0

## 0.6.3

### Patch Changes

- Updated dependencies [[`1e87f0e`](https://github.com/Blobscan/blobscan/commit/1e87f0ec6a9c94adb4fbecea7e6780f1ea1ff4ad), [`52ed449`](https://github.com/Blobscan/blobscan/commit/52ed449be8721dcf9352a9222cf087be2e6ba6bc)]:
  - @blobscan/db@0.25.0

## 0.6.2

### Patch Changes

- Updated dependencies [[`6a40ea2`](https://github.com/Blobscan/blobscan/commit/6a40ea282f9e55ff54a4e17b8ab19491b79c44b9), [`ee9f18d`](https://github.com/Blobscan/blobscan/commit/ee9f18d7451c9cf58f581aceea6687eba814df33)]:
  - @blobscan/db@0.24.0

## 0.6.1

### Patch Changes

- [#907](https://github.com/Blobscan/blobscan/pull/907) [`5f30a43`](https://github.com/Blobscan/blobscan/commit/5f30a435c2ded5d3c36b3c39b88ca8a582f19def) Thanks [@PJColombo](https://github.com/PJColombo)! - Used the new errors package to define and throw exceptions.

- Updated dependencies [[`183ff80`](https://github.com/Blobscan/blobscan/commit/183ff805884a17e56d84bf7710a1ccaa122b117c), [`96fd3b9`](https://github.com/Blobscan/blobscan/commit/96fd3b9ba660f48b3329ba019abd244fe9d82c9c), [`5f30a43`](https://github.com/Blobscan/blobscan/commit/5f30a435c2ded5d3c36b3c39b88ca8a582f19def)]:
  - @blobscan/db@0.23.0
  - @blobscan/errors@0.0.2
  - @blobscan/logger@0.1.4

## 0.6.0

### Minor Changes

- [#888](https://github.com/Blobscan/blobscan/pull/888) [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for injecting Prisma clients when creating syncers

### Patch Changes

- Updated dependencies [[`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b), [`54cdc87`](https://github.com/Blobscan/blobscan/commit/54cdc8763def3ee798e8b34c39eef4a5a93f8d1b)]:
  - @blobscan/db@0.22.0

## 0.5.3

### Patch Changes

- Updated dependencies [[`3fe35fe`](https://github.com/Blobscan/blobscan/commit/3fe35fe61eb3d2bae5f37e79b9a3921c7e59ba5a)]:
  - @blobscan/db@0.21.0

## 0.5.2

### Patch Changes

- Updated dependencies [[`77437ef`](https://github.com/Blobscan/blobscan/commit/77437ef5b3cfd26dfed0becd7d6f313373f8e4f4)]:
  - @blobscan/db@0.20.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`93dbcc1`](https://github.com/Blobscan/blobscan/commit/93dbcc1f99da33132c0d8ad7f94fd16d4836c12b)]:
  - @blobscan/db@0.19.0

## 0.5.0

### Minor Changes

- [#794](https://github.com/Blobscan/blobscan/pull/794) [`052da7e`](https://github.com/Blobscan/blobscan/commit/052da7e93a3c3289ec67097b8f8bc34315d84b2e) Thanks [@PJColombo](https://github.com/PJColombo)! - Updated eth usd price syncer to only index latest ETH price and removed any backfilling logic

### Patch Changes

- Updated dependencies [[`052da7e`](https://github.com/Blobscan/blobscan/commit/052da7e93a3c3289ec67097b8f8bc34315d84b2e), [`052da7e`](https://github.com/Blobscan/blobscan/commit/052da7e93a3c3289ec67097b8f8bc34315d84b2e)]:
  - @blobscan/price-feed@0.1.0
  - @blobscan/db@0.18.0

## 0.4.2

### Patch Changes

- [#789](https://github.com/Blobscan/blobscan/pull/789) [`3b54479`](https://github.com/Blobscan/blobscan/commit/3b54479da9d7e49398bd8f2b6ad8882b9fcb7a24) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved issue where the ETH-USD price feed syncer was creating new price feed state rows in the database on every run

## 0.4.1

### Patch Changes

- Updated dependencies [[`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92)]:
  - @blobscan/db@0.17.0

## 0.4.0

### Minor Changes

- [#731](https://github.com/Blobscan/blobscan/pull/731) [`29b205a`](https://github.com/Blobscan/blobscan/commit/29b205a0e096a7cf42f26554c2f4818c94303295) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added ETH price syncer

### Patch Changes

- Updated dependencies [[`29b205a`](https://github.com/Blobscan/blobscan/commit/29b205a0e096a7cf42f26554c2f4818c94303295)]:
  - @blobscan/db@0.16.0

## 0.3.5

### Patch Changes

- Updated dependencies [[`8e4633e`](https://github.com/Blobscan/blobscan/commit/8e4633eee4c0b736819d56ef6dc701d3df42d04d), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf)]:
  - @blobscan/db@0.15.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`242af90`](https://github.com/Blobscan/blobscan/commit/242af90b145ec95277172dc1a74ebb222231e58a)]:
  - @blobscan/db@0.14.0

## 0.3.3

### Patch Changes

- Updated dependencies [[`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202), [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256), [`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202)]:
  - @blobscan/db@0.13.0
  - @blobscan/logger@0.1.2

## 0.3.2

### Patch Changes

- Updated dependencies [[`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea), [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea)]:
  - @blobscan/db@0.12.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc)]:
  - @blobscan/db@0.11.0

## 0.3.0

### Minor Changes

- [#576](https://github.com/Blobscan/blobscan/pull/576) [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for category and rollup aggregations

### Patch Changes

- Updated dependencies [[`7240bba`](https://github.com/Blobscan/blobscan/commit/7240bba44dfa65d208cd027d723d9fb7a2f988f7), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`6eb69e8`](https://github.com/Blobscan/blobscan/commit/6eb69e8c6ba1450519b13c12255749fd36c62bee), [`3507a88`](https://github.com/Blobscan/blobscan/commit/3507a88edc5a9648664fba59f78481ecdc4ca77b)]:
  - @blobscan/db@0.10.0
  - @blobscan/dayjs@0.1.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7), [`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7)]:
  - @blobscan/db@0.9.0

## 0.2.0

### Minor Changes

- [#411](https://github.com/Blobscan/blobscan/pull/411) [`fb9c084`](https://github.com/Blobscan/blobscan/commit/fb9c08409ff43f2be14197bf0db9f5a2d2965ee9) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added swarm stamp syncer

- [#411](https://github.com/Blobscan/blobscan/pull/411) [`3393953`](https://github.com/Blobscan/blobscan/commit/33939533cf153b8caefff1b70c6dca5a6fe5c53b) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Refactored the stats syncer package to support general-purpose synchronization workers/queues.

  Key changes include:

      •	Renamed the package to syncers.
      •	Exported each syncer directly, removing the StatsSyncer managing entity.

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

- [#275](https://github.com/Blobscan/blobscan/pull/275) [`7e221cd`](https://github.com/Blobscan/blobscan/commit/7e221cd1226be84418658e3d6309dc0e396f671e) Thanks [@PJColombo](https://github.com/PJColombo)! - Patched daily stats updater to not aggregate data for days where some blocks still need to get indexed

- Updated dependencies [[`411023b`](https://github.com/Blobscan/blobscan/commit/411023b92abe25f21e06e4084faca43cde0f41c3), [`0c937dc`](https://github.com/Blobscan/blobscan/commit/0c937dc29f1fec3e9390179f0ae37559ba5ce6c3), [`824ccc0`](https://github.com/Blobscan/blobscan/commit/824ccc01ef8c533dcf5ed8d9cd1b5f9ce30ed145)]:
  - @blobscan/db@0.1.1
  - @blobscan/logger@0.0.3

## 0.1.0

### Minor Changes

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`4f26fe3`](https://github.com/Blobscan/blobscan/commit/4f26fe3bbe4a672681894294b51d4bc2359d965c) Thanks [@PJColombo](https://github.com/PJColombo)! - Enhanced overall stats calculation for scalability by enabling batch processing.

### Patch Changes

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`a42cd8c`](https://github.com/Blobscan/blobscan/commit/a42cd8c28ffc12c894577ca65ce5b51c00a970f7) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed exported stats syncer instance

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`0d0304e`](https://github.com/Blobscan/blobscan/commit/0d0304e3f9f01e3c5fed09c1952fb4c549fab1ea) Thanks [@PJColombo](https://github.com/PJColombo)! - Set up changeset

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`c90dc34`](https://github.com/Blobscan/blobscan/commit/c90dc3486301b777e5c7612c8e59407db77fe682) Thanks [@PJColombo](https://github.com/PJColombo)! - Improved daily stats aggregation to include calculations for every day from the last recorded date up to yesterday.

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`cfd7937`](https://github.com/Blobscan/blobscan/commit/cfd79374506bc9bb3420e6b0216642cead75f4e3) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed an issue where redis connection remained open after closing the stats syncer.

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a) Thanks [@PJColombo](https://github.com/PJColombo)! - Eliminated the need for the Beacon API endpoint in stats calculation by tracking the last finalized block in the database and utilizing it internally.

- Updated dependencies [[`71887f8`](https://github.com/Blobscan/blobscan/commit/71887f8dc09b45b0cb0748c0d6e8ddce2662f34d), [`2bce443`](https://github.com/Blobscan/blobscan/commit/2bce443401b1875df40298ebd957f86a92539397), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73), [`acf8dff`](https://github.com/Blobscan/blobscan/commit/acf8dff07d62a33d5dfa3789fd1f4e2aa3e968a3), [`263d86f`](https://github.com/Blobscan/blobscan/commit/263d86ff5e35f7cf9d5bf18f6b745f8dd6249e62), [`cb732e7`](https://github.com/Blobscan/blobscan/commit/cb732e7febcbc05bdec2221fec1213bcb8172717), [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a), [`5ed5186`](https://github.com/Blobscan/blobscan/commit/5ed51867d5b01b0572bfa69f3211a5b5bfaf254e)]:
  - @blobscan/db@0.1.0
  - @blobscan/logger@0.0.2
  - @blobscan/dayjs@0.0.2
