# @blobscan/stats-syncer

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
