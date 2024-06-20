# @blobscan/syncers

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

- [#275](https://github.com/Blobscan/blobscan/pull/275) [`7e221cd`](https://github.com/Blobscan/blobscan/commit/7e221cd1226be84418658e3d6309dc0e396f671e) Thanks [@PJColombo](https://github.com/PJColombo)! - Patched daily stats updater to not to aggregate data for days where some blocks still need to get indexed

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
