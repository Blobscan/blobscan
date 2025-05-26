# @blobscan/web

## 0.24.0

### Minor Changes

- [#762](https://github.com/Blobscan/blobscan/pull/762) [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added API key authentication to the `getBlobDataByBlobId` procedure

- [#762](https://github.com/Blobscan/blobscan/pull/762) [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Implemented blob data retrieval from storage URLs with proper handling of errors and missing data scenarios.

### Patch Changes

- [#768](https://github.com/Blobscan/blobscan/pull/768) [`7df3e2d`](https://github.com/Blobscan/blobscan/commit/7df3e2d6ab1bb392e67b79c1e484caa794ab7a6a) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Updated the rate limit logic to use ioredis instead of Vercel/KV

- Updated dependencies [[`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc), [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc), [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92), [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc), [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92), [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc), [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92), [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92)]:
  - @blobscan/api@0.21.0
  - @blobscan/db@0.17.0
  - @blobscan/rollups@0.3.2

## 0.23.1

### Patch Changes

- [`cbfcfca`](https://github.com/Blobscan/blobscan/commit/cbfcfcafe777a51ebe516f41cb15feb9be12772a) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Require NodeJS 22

## 0.23.0

### Minor Changes

- [#732](https://github.com/Blobscan/blobscan/pull/732) [`b6217e8`](https://github.com/Blobscan/blobscan/commit/b6217e810f77d105df356b866d5df432a96d88ab) Thanks [@xFJA](https://github.com/xFJA)! - Updated Home page charts: increase to 30 days the 'Blob Gas Price Expenditure' chart and replace Daily Transactions chart by 'Blobs per rollup'

### Patch Changes

- Updated dependencies [[`b6217e8`](https://github.com/Blobscan/blobscan/commit/b6217e810f77d105df356b866d5df432a96d88ab), [`29b205a`](https://github.com/Blobscan/blobscan/commit/29b205a0e096a7cf42f26554c2f4818c94303295)]:
  - @blobscan/api@0.20.0
  - @blobscan/db@0.16.0
  - @blobscan/rollups@0.3.1

## 0.22.0

### Minor Changes

- [#730](https://github.com/Blobscan/blobscan/pull/730) [`8e4633e`](https://github.com/Blobscan/blobscan/commit/8e4633eee4c0b736819d56ef6dc701d3df42d04d) Thanks [@PJColombo](https://github.com/PJColombo)! - Added following rollups: abstract, aevo, ancient8, arenaz, bob, debankchain, ethernity, fraxtal, fuel, hashkey, hemi, hypr, infinaeon, ink, karak, kinto, lambda, lisk, manta, mantle, metamail, metis, mint, morph, nal, nanonnetwork, opbnb, optopia, orderly, pandasea, parallel, phala, polynomial, r0ar, race, rari, shape, snaxchain, soneium, superlumio, superseed, swanchain, swellchain, unichain, world, xga, zeronetwork and zircuit

- [#739](https://github.com/Blobscan/blobscan/pull/739) [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf) Thanks [@PJColombo](https://github.com/PJColombo)! - Reallocated the `rollup` field from the `Transaction` model to the `Address` model

### Patch Changes

- Updated dependencies [[`8e4633e`](https://github.com/Blobscan/blobscan/commit/8e4633eee4c0b736819d56ef6dc701d3df42d04d), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf)]:
  - @blobscan/rollups@0.3.0
  - @blobscan/api@0.19.0
  - @blobscan/db@0.15.0

## 0.21.0

### Minor Changes

- [#719](https://github.com/Blobscan/blobscan/pull/719) [`9b403be`](https://github.com/Blobscan/blobscan/commit/9b403be258b2daa8b2b415180c1a2a415375ab63) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for calculating the blob gas target using Pectra update params

## 0.20.1

### Patch Changes

- [#724](https://github.com/Blobscan/blobscan/pull/724) [`baecae5`](https://github.com/Blobscan/blobscan/commit/baecae5f7bb30a1c3845fd241eaa25ecc83b4abc) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed skeleton display from navigation items component if the env vars are not set

- Updated dependencies [[`1ab2c7f`](https://github.com/Blobscan/blobscan/commit/1ab2c7fddce9883b81387bce0e11ac8104c7d983)]:
  - @blobscan/api@0.18.1

## 0.20.0

### Minor Changes

- [#678](https://github.com/Blobscan/blobscan/pull/678) [`22ae59a`](https://github.com/Blobscan/blobscan/commit/22ae59a36fe8a35c0055b053bb288e7f071132a2) Thanks [@xFJA](https://github.com/xFJA)! - Get environment variables from API endpoint.

### Patch Changes

- [#658](https://github.com/Blobscan/blobscan/pull/658) [`95f8043`](https://github.com/Blobscan/blobscan/commit/95f8043f253e83d37e224ccfd63f4c61088af4c2) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Improved Optimism tx decoded fields card

- Updated dependencies [[`9f88066`](https://github.com/Blobscan/blobscan/commit/9f88066f7445d3bfddc9088fe7078a9d53d9828e), [`242af90`](https://github.com/Blobscan/blobscan/commit/242af90b145ec95277172dc1a74ebb222231e58a), [`b90971b`](https://github.com/Blobscan/blobscan/commit/b90971b1415e32c23c530feff1fc2dd1560d377d), [`95f8043`](https://github.com/Blobscan/blobscan/commit/95f8043f253e83d37e224ccfd63f4c61088af4c2), [`27cddc4`](https://github.com/Blobscan/blobscan/commit/27cddc45aeb593d1dd9a1c693d5bfe69b6569f9a)]:
  - @blobscan/api@0.18.0
  - @blobscan/db@0.14.0
  - @blobscan/rollups@0.2.3

## 0.19.0

### Minor Changes

- [#681](https://github.com/Blobscan/blobscan/pull/681) [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256) Thanks [@PJColombo](https://github.com/PJColombo)! - Added Weavevm blob storage support

- [#665](https://github.com/Blobscan/blobscan/pull/665) [`a0f594f`](https://github.com/Blobscan/blobscan/commit/a0f594fb31aa6c811b03c5d07c725d8bdc391813) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added a help tooltip to each field in the block details page

- [#664](https://github.com/Blobscan/blobscan/pull/664) [`bdda00f`](https://github.com/Blobscan/blobscan/commit/bdda00f7513328cb9fa6601c9007baf14af242dc) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Allowed to toggle the timestamp column between relative time and date-time format in blobs, blocks and txs pages.

### Patch Changes

- Updated dependencies [[`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202), [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256), [`6a06872`](https://github.com/Blobscan/blobscan/commit/6a06872d13de893f821200b3541567b413916c9a), [`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202)]:
  - @blobscan/db@0.13.0
  - @blobscan/api@0.17.0
  - @blobscan/env@0.1.0
  - @blobscan/rollups@0.2.2
  - @blobscan/open-telemetry@0.0.9
  - @blobscan/blob-decoder@0.2.1

## 0.18.0

### Minor Changes

- [#623](https://github.com/Blobscan/blobscan/pull/623) [`025484b`](https://github.com/Blobscan/blobscan/commit/025484be6b12344cfa5a40cda963827aa60cb1e3) Thanks [@xFJA](https://github.com/xFJA)! - Added category column to blob, block and transaction tables.

- [#661](https://github.com/Blobscan/blobscan/pull/661) [`9bceee3`](https://github.com/Blobscan/blobscan/commit/9bceee3d9b22d68c3c97bd380d5771c8a2763189) Thanks [@xFJA](https://github.com/xFJA)! - Improved the block row rollup icons column by removing duplicated icons.

- [#622](https://github.com/Blobscan/blobscan/pull/622) [`d714683`](https://github.com/Blobscan/blobscan/commit/d71468364da0bbadc7b9c8b74071ebb4b810c252) Thanks [@xFJA](https://github.com/xFJA)! - Added copyable behavior to hashes and addresses in blob, block and transaction tables.

- [#637](https://github.com/Blobscan/blobscan/pull/637) [`ca30a0f`](https://github.com/Blobscan/blobscan/commit/ca30a0f03c11dfc0c4a25d18fdde2365458b17ca) Thanks [@xFJA](https://github.com/xFJA)! - Added 'Category' filter for blobs, blocks and transactions.

### Patch Changes

- [#644](https://github.com/Blobscan/blobscan/pull/644) [`cc62af6`](https://github.com/Blobscan/blobscan/commit/cc62af6bcd59917136c27ce02d2d659c43d42f5e) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed an issue where the Rollup filter was not being set correctly from query parameters

- [#662](https://github.com/Blobscan/blobscan/pull/662) [`0057df3`](https://github.com/Blobscan/blobscan/commit/0057df33b19b0cdf980393fa22a8227adf3a798f) Thanks [@xFJA](https://github.com/xFJA)! - Fixed misalignment for charts in home page.

- [#657](https://github.com/Blobscan/blobscan/pull/657) [`9599958`](https://github.com/Blobscan/blobscan/commit/9599958f518beca46bd906f29352538328482aa2) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Fixed an issue on the blob details page where the 'Show More' and 'Show Less' labels were displayed incorrectly

- [#656](https://github.com/Blobscan/blobscan/pull/656) [`759fc95`](https://github.com/Blobscan/blobscan/commit/759fc951c9397f9139a9941d1920b6d8716a8c09) Thanks [@xFJA](https://github.com/xFJA)! - Fixed Ether display overflow in Transaction details card for small screens.

- [#631](https://github.com/Blobscan/blobscan/pull/631) [`d5ef1bc`](https://github.com/Blobscan/blobscan/commit/d5ef1bc91100131d5179ad0786a2a8c743ef03d9) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added a link to the L1 origin block if the full hash is found using the optimism decoded fields.

- [#632](https://github.com/Blobscan/blobscan/pull/632) [`b89af3a`](https://github.com/Blobscan/blobscan/commit/b89af3a52e07e1fe5786abed93b702ba6d1ac997) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Improved the home lists spacing

- Updated dependencies [[`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`025484b`](https://github.com/Blobscan/blobscan/commit/025484be6b12344cfa5a40cda963827aa60cb1e3), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea), [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea), [`ca30a0f`](https://github.com/Blobscan/blobscan/commit/ca30a0f03c11dfc0c4a25d18fdde2365458b17ca), [`ca30a0f`](https://github.com/Blobscan/blobscan/commit/ca30a0f03c11dfc0c4a25d18fdde2365458b17ca)]:
  - @blobscan/db@0.12.0
  - @blobscan/api@0.16.0
  - @blobscan/rollups@0.2.1

## 0.17.0

### Minor Changes

- [#602](https://github.com/Blobscan/blobscan/pull/602) [`5272928`](https://github.com/Blobscan/blobscan/commit/52729282f0feefbb6cf268da73930c4f60462f21) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Enhanced feedback modal by allowing users to report issues on Github

### Patch Changes

- [#608](https://github.com/Blobscan/blobscan/pull/608) [`4226258`](https://github.com/Blobscan/blobscan/commit/422625886481de3ca737b6edfe0afb5fe4fe1427) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Improved decoding display for Optimism blobs; removed truncated Parent L2 block hash link, fixed L1 origin block redirection, and corrected timestamp.

- [#598](https://github.com/Blobscan/blobscan/pull/598) [`05bdc1d`](https://github.com/Blobscan/blobscan/commit/05bdc1d0645bf510df211eb8c0d2bda63ffd1c76) Thanks [@PJColombo](https://github.com/PJColombo)! - Standardized y-axis units and displayed full amounts on tooltips on charts

- [#627](https://github.com/Blobscan/blobscan/pull/627) [`f21f6fc`](https://github.com/Blobscan/blobscan/commit/f21f6fcb752f6ce5f25339b426e1dcbb29d9d280) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Fixed an issue where the search result wasn't being displayed properly

- [#598](https://github.com/Blobscan/blobscan/pull/598) [`05bdc1d`](https://github.com/Blobscan/blobscan/commit/05bdc1d0645bf510df211eb8c0d2bda63ffd1c76) Thanks [@PJColombo](https://github.com/PJColombo)! - Displayed full amounts on chart tooltips

- Updated dependencies [[`05bdc1d`](https://github.com/Blobscan/blobscan/commit/05bdc1d0645bf510df211eb8c0d2bda63ffd1c76)]:
  - @blobscan/eth-format@0.1.0

## 0.16.0

### Minor Changes

- [#592](https://github.com/Blobscan/blobscan/pull/592) [`76bd799`](https://github.com/Blobscan/blobscan/commit/76bd7990ea36b2826924cdbec6ddc660e96b1a17) Thanks [@xFJA](https://github.com/xFJA)! - Added multiple options to RollupFilter

### Patch Changes

- [#625](https://github.com/Blobscan/blobscan/pull/625) [`f93f96f`](https://github.com/Blobscan/blobscan/commit/f93f96fe023567f2354ce106454d8614da86ed43) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed Gitcoin Round 22 banner

- [#592](https://github.com/Blobscan/blobscan/pull/592) [`76bd799`](https://github.com/Blobscan/blobscan/commit/76bd7990ea36b2826924cdbec6ddc660e96b1a17) Thanks [@xFJA](https://github.com/xFJA)! - Added missing rollups icons and improved RollupBadges' styles

- Updated dependencies [[`76bd799`](https://github.com/Blobscan/blobscan/commit/76bd7990ea36b2826924cdbec6ddc660e96b1a17)]:
  - @blobscan/api@0.15.0

## 0.15.0

### Minor Changes

- [#529](https://github.com/Blobscan/blobscan/pull/529) [`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Displayed Optimism decoded blob data

### Patch Changes

- [#606](https://github.com/Blobscan/blobscan/pull/606) [`ba1d783`](https://github.com/Blobscan/blobscan/commit/ba1d78376100a65389cc4a9eac9e399ff2f3627d) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed "transaction" from decoded fields header

- [#612](https://github.com/Blobscan/blobscan/pull/612) [`4b75e4a`](https://github.com/Blobscan/blobscan/commit/4b75e4a254a693ff6aabbdce69d0c48fb348b0d4) Thanks [@PJColombo](https://github.com/PJColombo)! - Added Gitcoin Round 22 banner

- [#606](https://github.com/Blobscan/blobscan/pull/606) [`ba1d783`](https://github.com/Blobscan/blobscan/commit/ba1d78376100a65389cc4a9eac9e399ff2f3627d) Thanks [@PJColombo](https://github.com/PJColombo)! - Hid decoded fields section when there is no decoded data available

- [#599](https://github.com/Blobscan/blobscan/pull/599) [`9dd0f3f`](https://github.com/Blobscan/blobscan/commit/9dd0f3f2c648899c71fc37b5271e313f778f994d) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Fixed an issue where the app version info in the footer was not displayed correctly, and ensured the link directs users to the correct release page

- [#582](https://github.com/Blobscan/blobscan/pull/582) [`7f55095`](https://github.com/Blobscan/blobscan/commit/7f550957a0e1fc8c3c1033e836628b372f9ecac0) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added a new label "reorg" to the reorged slots/blocks search results

- Updated dependencies [[`c3cfd46`](https://github.com/Blobscan/blobscan/commit/c3cfd46cfe65c35ef2bfa0464951cdd78c1a51b8), [`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc), [`dd75d56`](https://github.com/Blobscan/blobscan/commit/dd75d56d8ce2ef881c55ac843d9e9937939d671b), [`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc)]:
  - @blobscan/rollups@0.2.0
  - @blobscan/api@0.14.0
  - @blobscan/db@0.11.0

## 0.14.0

### Minor Changes

- [#537](https://github.com/Blobscan/blobscan/pull/537) [`a6795aa`](https://github.com/Blobscan/blobscan/commit/a6795aadc2590fc05b95f7a908d1990be4b09670) Thanks [@PJColombo](https://github.com/PJColombo)! - Updated StarkNet’s Majin blob decoder to the latest version and adjusted the decoded blob UI to reflect the recent changes.

- [#497](https://github.com/Blobscan/blobscan/pull/497) [`a59d7cd`](https://github.com/Blobscan/blobscan/commit/a59d7cd4564cf10b28ed60a0a9a2de3e41b0501a) Thanks [@xFJA](https://github.com/xFJA)! - Added Timestamp filter to PaginatedTable filter panel

- [#456](https://github.com/Blobscan/blobscan/pull/456) [`fbace2f`](https://github.com/Blobscan/blobscan/commit/fbace2f0c9f2dee4787b653511cc7ff8e0fd5026) Thanks [@xFJA](https://github.com/xFJA)! - Replaced list of BlobCards by new PaginatedTable on the blobs view

- [#486](https://github.com/Blobscan/blobscan/pull/486) [`be191ba`](https://github.com/Blobscan/blobscan/commit/be191ba86e1c5759e84da0ba01d04ab47e7b609a) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Improved button component props, variants and sizing logic

- [#496](https://github.com/Blobscan/blobscan/pull/496) [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f) Thanks [@xFJA](https://github.com/xFJA)! - Enhanced dropdowns with clearable option support

- [#553](https://github.com/Blobscan/blobscan/pull/553) [`c57d7fe`](https://github.com/Blobscan/blobscan/commit/c57d7fe2c7f01ba0cf24c199bbedbe3515a89872) Thanks [@xFJA](https://github.com/xFJA)! - Moved less important items from ExplorerDetails to footer

- [#470](https://github.com/Blobscan/blobscan/pull/470) [`4bc7884`](https://github.com/Blobscan/blobscan/commit/4bc78848b57d2c2cfe6053a34ec2bc3e85cacfcf) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added blob gas price to the ExplorerDetails component

- [#525](https://github.com/Blobscan/blobscan/pull/525) [`9ba363e`](https://github.com/Blobscan/blobscan/commit/9ba363e5fc278bfa7c2daf70f241e31f2400d694) Thanks [@xFJA](https://github.com/xFJA)! - Added slot range filter to blocks view

- [#457](https://github.com/Blobscan/blobscan/pull/457) [`88c94df`](https://github.com/Blobscan/blobscan/commit/88c94df96f784063cea56e3d5f3a052d17a9ad20) Thanks [@xFJA](https://github.com/xFJA)! - Replaced list of BlockCards by new PaginatedTable on the blocks view

- [#522](https://github.com/Blobscan/blobscan/pull/522) [`9c56d5b`](https://github.com/Blobscan/blobscan/commit/9c56d5b9572b1b963ae38747fa7235da3ccd42df) Thanks [@xFJA](https://github.com/xFJA)! - Added BlockNumber filter to PaginatedTable filter panel

- [#469](https://github.com/Blobscan/blobscan/pull/469) [`e8bb0e5`](https://github.com/Blobscan/blobscan/commit/e8bb0e59a67e28fca16985e532b3e29412e56b45) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added a sidebar navigation menu for smaller screens

- [#543](https://github.com/Blobscan/blobscan/pull/543) [`958c234`](https://github.com/Blobscan/blobscan/commit/958c23464397657c4d2e5613fa80eb6c095340da) Thanks [@xFJA](https://github.com/xFJA)! - Added sort input in the Filters

- [#496](https://github.com/Blobscan/blobscan/pull/496) [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f) Thanks [@xFJA](https://github.com/xFJA)! - Added rollup filter to blobs, blocks and transactions views

- [#493](https://github.com/Blobscan/blobscan/pull/493) [`43f626b`](https://github.com/Blobscan/blobscan/commit/43f626b0f764ecc475072190da362a15791c01de) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Corrected formatWei precision for large decimal values

- [#479](https://github.com/Blobscan/blobscan/pull/479) [`2ded4f9`](https://github.com/Blobscan/blobscan/commit/2ded4f99259b2d46ebc6b0d66f50bdd1b1275559) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added navigation arrow buttons to navigate to previous and next block

- [#458](https://github.com/Blobscan/blobscan/pull/458) [`ff075a9`](https://github.com/Blobscan/blobscan/commit/ff075a9f558ee018b54666b7a24ae91931a84eca) Thanks [@xFJA](https://github.com/xFJA)! - Replaced list of TransactionCards by new PaginatedTable on the transactions view

- [#464](https://github.com/Blobscan/blobscan/pull/464) [`dbe414b`](https://github.com/Blobscan/blobscan/commit/dbe414bd8bbe201eb50f614a6c1dbcb6e6abdab2) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added a loading spinner and a not-found window to the SearchInput component

- [#478](https://github.com/Blobscan/blobscan/pull/478) [`85afe5b`](https://github.com/Blobscan/blobscan/commit/85afe5b36a3222428d78b7fa5f38019174aea258) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added CopyToClipboard component

### Patch Changes

- [#527](https://github.com/Blobscan/blobscan/pull/527) [`c9a6ada`](https://github.com/Blobscan/blobscan/commit/c9a6ada1c1bac79f43a2f183baf2d936113e1199) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Updated `DailyAvgBlobFeeChart` and `DailyAvgBlobGasPriceChart` to use the best unit for values

- [#581](https://github.com/Blobscan/blobscan/pull/581) [`bd8a4cb`](https://github.com/Blobscan/blobscan/commit/bd8a4cbb0840780b95c48fbdcaa68c711242558d) Thanks [@PJColombo](https://github.com/PJColombo)! - Improved performance on Blobs, Blocks and Txs pages by fetching the total amount of items only once and not on every request

- [#575](https://github.com/Blobscan/blobscan/pull/575) [`53acaf1`](https://github.com/Blobscan/blobscan/commit/53acaf11b3e9f3525b6038bb4f7a41e5640f4b4a) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Fixed an issue where the chart tooltip displayed zero for very low values. It now shows the most appropriate unit for each value.

- [#563](https://github.com/Blobscan/blobscan/pull/563) [`76d8cf9`](https://github.com/Blobscan/blobscan/commit/76d8cf9213f8af1af3d4341fc3a4ea8c0854a03a) Thanks [@xFJA](https://github.com/xFJA)! - Fixed top explorer details not horizontally aligned in small screens.

- [#534](https://github.com/Blobscan/blobscan/pull/534) [`d829a51`](https://github.com/Blobscan/blobscan/commit/d829a519d022c0179f21d1b0cc56b77c1c451a25) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed an issue where pagination buttons failed to redirect upon click.

- [#503](https://github.com/Blobscan/blobscan/pull/503) [`d0b07e1`](https://github.com/Blobscan/blobscan/commit/d0b07e1fda620b83bd7805a1792a697b92becfd6) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Enhanced Swarm data expiry formatting

- [#568](https://github.com/Blobscan/blobscan/pull/568) [`cd6176b`](https://github.com/Blobscan/blobscan/commit/cd6176b79627c57288a708aec5948ecc24ebd25f) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Fixed the issue where the "Show more" message was displayed incorrectly when the blob data container was opened and closed. The message now properly toggles between "Show more" when the container is closed and "Show less" when the container is open.

- [#504](https://github.com/Blobscan/blobscan/pull/504) [`7de9681`](https://github.com/Blobscan/blobscan/commit/7de9681e33e71519db68184f740ffb1eb19a78db) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Updated latest blob gas price metric to display the most suitable unit, replacing the previously fixed `Gwei` format

- [#446](https://github.com/Blobscan/blobscan/pull/446) [`c6dba39`](https://github.com/Blobscan/blobscan/commit/c6dba39665ce1df135d1f4b6ae2a324a936370b3) Thanks [@PJColombo](https://github.com/PJColombo)! - Updated blob storage badges to use blob data reference url

- [#515](https://github.com/Blobscan/blobscan/pull/515) [`b23e7d7`](https://github.com/Blobscan/blobscan/commit/b23e7d7b5aa538269863e9df32d2c10d7ddb396b) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Updates the convertWei function to handle decimal values

- [#544](https://github.com/Blobscan/blobscan/pull/544) [`1bbf650`](https://github.com/Blobscan/blobscan/commit/1bbf650f1c987fb706862fa99329302c9cd25cfd) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added a page with all the stats from the blobs, blocks and transactions

- [#491](https://github.com/Blobscan/blobscan/pull/491) [`a36786f`](https://github.com/Blobscan/blobscan/commit/a36786f924e6bab125ee6d567dea3230a453f049) Thanks [@xFJA](https://github.com/xFJA)! - Refactored Dropdown options using a new type to allow add new elements to the Option display

- [#561](https://github.com/Blobscan/blobscan/pull/561) [`9b6847f`](https://github.com/Blobscan/blobscan/commit/9b6847f333f31b8f417c88137eb3ef9b36633e3c) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Fixed the transaction hash overlap in the blob page

- [#564](https://github.com/Blobscan/blobscan/pull/564) [`79b4f58`](https://github.com/Blobscan/blobscan/commit/79b4f58f887c40b1f5d444b6ffe93189900a5a8f) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Fixed copyable values overflow viewport on small screens

- [#488](https://github.com/Blobscan/blobscan/pull/488) [`7e49c8b`](https://github.com/Blobscan/blobscan/commit/7e49c8be8d6e2fc3df5bbd054f39f7c7df12dc8a) Thanks [@xFJA](https://github.com/xFJA)! - Fixed 'Displayed Items' dropdown in PaginedTable

- [#496](https://github.com/Blobscan/blobscan/pull/496) [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f) Thanks [@xFJA](https://github.com/xFJA)! - Added support for clearing dropdown

- [#531](https://github.com/Blobscan/blobscan/pull/531) [`308db72`](https://github.com/Blobscan/blobscan/commit/308db72ec9651cd81fd3f9df1a445eeabdcf88b2) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added finalized status field to block, tx and blob views

- [#566](https://github.com/Blobscan/blobscan/pull/566) [`e6d78aa`](https://github.com/Blobscan/blobscan/commit/e6d78aaba3ec1ea3f7400a9ed5e8d3b1099e6878) Thanks [@xFJA](https://github.com/xFJA)! - Fixed overflow style and responsiveness issues in Filters.

- [#552](https://github.com/Blobscan/blobscan/pull/552) [`253f293`](https://github.com/Blobscan/blobscan/commit/253f2937de2e0f35fc3f06b7616c31cdc040a7c3) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added navigation arrows to the transaction page

- [#506](https://github.com/Blobscan/blobscan/pull/506) [`04ae214`](https://github.com/Blobscan/blobscan/commit/04ae214f635b2b3e90e9d98873316362bb9d2255) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Fixed inconsistent column spacing on the homepage

- [#507](https://github.com/Blobscan/blobscan/pull/507) [`7cd9a73`](https://github.com/Blobscan/blobscan/commit/7cd9a73a1ee279d2840ae8d8e536578b81b11026) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added additional logic to the `Tooltip` component to prevent overflow.

- [#509](https://github.com/Blobscan/blobscan/pull/509) [`399c98c`](https://github.com/Blobscan/blobscan/commit/399c98c162a36f59a9e79558fb934c65de15144b) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Resolved homepage metrics display overflow issue

- Updated dependencies [[`7240bba`](https://github.com/Blobscan/blobscan/commit/7240bba44dfa65d208cd027d723d9fb7a2f988f7), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`c6dba39`](https://github.com/Blobscan/blobscan/commit/c6dba39665ce1df135d1f4b6ae2a324a936370b3), [`dc3afe7`](https://github.com/Blobscan/blobscan/commit/dc3afe795cebba83d7637f4c2866aafbcf009309), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`a6795aa`](https://github.com/Blobscan/blobscan/commit/a6795aadc2590fc05b95f7a908d1990be4b09670), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`4bc7884`](https://github.com/Blobscan/blobscan/commit/4bc78848b57d2c2cfe6053a34ec2bc3e85cacfcf), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`bbf5111`](https://github.com/Blobscan/blobscan/commit/bbf5111afe84d70ada171de191f7095d2af518da), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`6eb69e8`](https://github.com/Blobscan/blobscan/commit/6eb69e8c6ba1450519b13c12255749fd36c62bee), [`a84b544`](https://github.com/Blobscan/blobscan/commit/a84b5443b32e5a5cea76cedb2ba50c11742f24a7), [`bd8a4cb`](https://github.com/Blobscan/blobscan/commit/bd8a4cbb0840780b95c48fbdcaa68c711242558d), [`03fb6b0`](https://github.com/Blobscan/blobscan/commit/03fb6b0d3291a85e80cbdab6cb497b782b17e7e8), [`3507a88`](https://github.com/Blobscan/blobscan/commit/3507a88edc5a9648664fba59f78481ecdc4ca77b), [`6eb69e8`](https://github.com/Blobscan/blobscan/commit/6eb69e8c6ba1450519b13c12255749fd36c62bee)]:
  - @blobscan/api@0.13.0
  - @blobscan/db@0.10.0
  - @blobscan/rollups@0.1.0
  - @blobscan/blob-decoder@0.2.0
  - @blobscan/dayjs@0.1.0

## 0.13.1

### Patch Changes

- Updated dependencies [[`8d27043`](https://github.com/Blobscan/blobscan/commit/8d27043ea464c34cfeef29ae996fca0ee6d2c1ab), [`634274b`](https://github.com/Blobscan/blobscan/commit/634274bd0940f081d8faa54fd68a892e450ae7ad)]:
  - @blobscan/api@0.12.0

## 0.13.0

### Minor Changes

- [#439](https://github.com/Blobscan/blobscan/pull/439) [`28a9642`](https://github.com/Blobscan/blobscan/commit/28a96423215afdfeb89850d2ebcb17180f3ff7c4) Thanks [@PJColombo](https://github.com/PJColombo)! - Displayed transaction index on transaction details page

### Patch Changes

- [#441](https://github.com/Blobscan/blobscan/pull/441) [`f86465f`](https://github.com/Blobscan/blobscan/commit/f86465f88fb46150b5fbf7623a9d7242c06490c2) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed an issue where blob transaction card wasn't displaying block timestamp correctly

- Updated dependencies [[`f86465f`](https://github.com/Blobscan/blobscan/commit/f86465f88fb46150b5fbf7623a9d7242c06490c2), [`28a9642`](https://github.com/Blobscan/blobscan/commit/28a96423215afdfeb89850d2ebcb17180f3ff7c4)]:
  - @blobscan/api@0.11.0

## 0.12.0

### Minor Changes

- [#415](https://github.com/Blobscan/blobscan/pull/415) [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Dropped average blob size stat

### Patch Changes

- [#412](https://github.com/Blobscan/blobscan/pull/412) [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Replaced local environment variables with the `@blobscan/env` package

- [#414](https://github.com/Blobscan/blobscan/pull/414) [`dcbd95f`](https://github.com/Blobscan/blobscan/commit/dcbd95f08d25d14a005ad4093374e96a8291a314) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Hidden swarm data expiration metric when swarm is not set

- Updated dependencies [[`a00fdbb`](https://github.com/Blobscan/blobscan/commit/a00fdbb08a5d17a07e7a4f759572fd598ccf7ce7), [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`89d80a8`](https://github.com/Blobscan/blobscan/commit/89d80a83257659074c6e3da2e4dfb0f87842a5b8), [`e2bc7cc`](https://github.com/Blobscan/blobscan/commit/e2bc7ccb0cedf74fd1811f6ba76f672d67218e84), [`097f5d5`](https://github.com/Blobscan/blobscan/commit/097f5d5be60a2bfb82faf8731e1901144abf125a)]:
  - @blobscan/api@0.10.0
  - @blobscan/open-telemetry@0.0.8
  - @blobscan/blob-decoder@0.1.1

## 0.11.0

### Minor Changes

- [#409](https://github.com/Blobscan/blobscan/pull/409) [`4ff5c4d`](https://github.com/Blobscan/blobscan/commit/4ff5c4d720463fd607a32fe35466a3e0dad045f9) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for Taiko, Blast, and Optopia rollups

### Patch Changes

- Updated dependencies [[`274e838`](https://github.com/Blobscan/blobscan/commit/274e838c71e7364068cc4c156e2f310cb58122ee), [`274e838`](https://github.com/Blobscan/blobscan/commit/274e838c71e7364068cc4c156e2f310cb58122ee)]:
  - @blobscan/api@0.9.2

## 0.10.0

### Minor Changes

- [#370](https://github.com/Blobscan/blobscan/pull/370) [`f89531c`](https://github.com/Blobscan/blobscan/commit/f89531cae5751f184e6cc5a89261d72f1a64dfb9) Thanks [@PJColombo](https://github.com/PJColombo)! - Added starknet decoded blob view

- [#370](https://github.com/Blobscan/blobscan/pull/370) [`f3cac78`](https://github.com/Blobscan/blobscan/commit/f3cac784beb47f7638715b88b78408b9555f36ce) Thanks [@PJColombo](https://github.com/PJColombo)! - Added rollup tag to blob details page

- [#404](https://github.com/Blobscan/blobscan/pull/404) [`35723aa`](https://github.com/Blobscan/blobscan/commit/35723aad13746ee6e50a22f2abd4200a3c8cadb5) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed Blossom Labs footer text

### Patch Changes

- [#370](https://github.com/Blobscan/blobscan/pull/370) [`aa1b3cd`](https://github.com/Blobscan/blobscan/commit/aa1b3cd2510de52665192da6f22dceac13edab84) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed dropdown list

- [#370](https://github.com/Blobscan/blobscan/pull/370) [`874c8f0`](https://github.com/Blobscan/blobscan/commit/874c8f0702b3b82f0bc3d4737503a941d8120fcd) Thanks [@PJColombo](https://github.com/PJColombo)! - Handled blob decoding errors

- Updated dependencies [[`874c8f0`](https://github.com/Blobscan/blobscan/commit/874c8f0702b3b82f0bc3d4737503a941d8120fcd), [`9d865cd`](https://github.com/Blobscan/blobscan/commit/9d865cdddc88c472f0b0e177b4705288d1f57791)]:
  - @blobscan/blob-decoder@0.1.0

## 0.9.3

### Patch Changes

- Updated dependencies [[`9d2e6ac`](https://github.com/Blobscan/blobscan/commit/9d2e6aca545a3dde9be5742afbe71b12d675420c)]:
  - @blobscan/api@0.9.0

## 0.9.2

### Patch Changes

- [#387](https://github.com/Blobscan/blobscan/pull/387) [`7e12a3e`](https://github.com/Blobscan/blobscan/commit/7e12a3e3b17c59750bdcd0fcede4bc67c9b23211) Thanks [@0xGabi](https://github.com/0xGabi)! - Added new rollups badges and icons

- Updated dependencies [[`737272d`](https://github.com/Blobscan/blobscan/commit/737272d6312bd478b1662133b875b50457694f10), [`ffbb8e6`](https://github.com/Blobscan/blobscan/commit/ffbb8e6074878e30c9aa5ac8e774dbbb8060fb96), [`57723f3`](https://github.com/Blobscan/blobscan/commit/57723f351f4a63a5b86558e447ee5d6fe2f947c8), [`1cce838`](https://github.com/Blobscan/blobscan/commit/1cce8387e28488946b83c5a8a36a2e0db1d595c9), [`d7a760d`](https://github.com/Blobscan/blobscan/commit/d7a760da302ce01f1f6f1072d98a10cc100dc1f5)]:
  - @blobscan/api@0.8.1
  - @blobscan/open-telemetry@0.0.7

## 0.9.1

### Patch Changes

- [`6cddc5f`](https://github.com/Blobscan/blobscan/commit/6cddc5f17bc23f086b35218a105cd3649ab0415e) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed issue related to not display blobs when displaying a non-compacted blob transaction card

## 0.9.0

### Minor Changes

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`4b5be80`](https://github.com/Blobscan/blobscan/commit/4b5be80e46f1290d136cbfbc3ed2f117f195c84f) Thanks [@PJColombo](https://github.com/PJColombo)! - Displayed web app's version instead of last commit

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`04d6061`](https://github.com/Blobscan/blobscan/commit/04d60618542bb66fc64645829c191f2379bbd2ab) Thanks [@PJColombo](https://github.com/PJColombo)! - Added rollup and blob storage icons to blob card

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`bc2572f`](https://github.com/Blobscan/blobscan/commit/bc2572f4a020dd5c374c96d9998212017ca4dd98) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for automatically choosing the most suitable target unit on ether unit displays

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`e7c7bbe`](https://github.com/Blobscan/blobscan/commit/e7c7bbe3d126affba027a71008883a1e2d640f78) Thanks [@PJColombo](https://github.com/PJColombo)! - Added sliding items animation to latest blobs, blocks and transactions section in homepage

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`7d50130`](https://github.com/Blobscan/blobscan/commit/7d5013079ccc8d6e0f6cccd39faf60186853e532) Thanks [@PJColombo](https://github.com/PJColombo)! - Added animation to loading chart skeleton

### Patch Changes

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`3e83465`](https://github.com/Blobscan/blobscan/commit/3e8346573a164db081e80173048549e3f5ff44f1) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed blob transaction card skeletons

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`d5c1388`](https://github.com/Blobscan/blobscan/commit/d5c1388e86b13cc4b6fb9ac28500b1cd4d409da8) Thanks [@PJColombo](https://github.com/PJColombo)! - Unified card headers stylings

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`08679e1`](https://github.com/Blobscan/blobscan/commit/08679e193596b239c24fcf61eda9ee0b72580d57) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved Blobscan logo layout shift issue

- [#371](https://github.com/Blobscan/blobscan/pull/371) [`277e1a8`](https://github.com/Blobscan/blobscan/commit/277e1a812dfdffe8a9fbe9bc262a5058e1418464) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed top bar details item's layout

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`9140be4`](https://github.com/Blobscan/blobscan/commit/9140be48889c7afef774ab6ed87e06c03a806992) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed app layout margins

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`019c3cc`](https://github.com/Blobscan/blobscan/commit/019c3cc767021e9241b312346ac6ec52d63dec35) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed search button extended size on Safari and Firefox issue

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`45ad566`](https://github.com/Blobscan/blobscan/commit/45ad56641dc1fca4978ac2a4ba898adb0fa80ad3) Thanks [@PJColombo](https://github.com/PJColombo)! - Grouped top bar's navigation menu items together

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`b19fa45`](https://github.com/Blobscan/blobscan/commit/b19fa45b1582feeca7e08a63815a59923e8ef021) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed chart tooltip display

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`3c6dc91`](https://github.com/Blobscan/blobscan/commit/3c6dc919c97ed7e48e4afe5ea26f6f5c6f317cb0) Thanks [@PJColombo](https://github.com/PJColombo)! - Improved block and transaction cards

- [#374](https://github.com/Blobscan/blobscan/pull/374) [`76b83e9`](https://github.com/Blobscan/blobscan/commit/76b83e934ee0686875887a161d7f119f139c7d8d) Thanks [@PJColombo](https://github.com/PJColombo)! - Adjust light theme colors in blob gas comparison chart

## 0.8.0

### Minor Changes

- [#358](https://github.com/Blobscan/blobscan/pull/358) [`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8) Thanks [@PJColombo](https://github.com/PJColombo)! - Added file system blob storage

### Patch Changes

- [#367](https://github.com/Blobscan/blobscan/pull/367) [`d185c88`](https://github.com/Blobscan/blobscan/commit/d185c88ac2d757ab621e88797f5a8bf644b99072) Thanks [@PJColombo](https://github.com/PJColombo)! - Set up sentry

- Updated dependencies [[`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8)]:
  - @blobscan/api@0.8.0

## 0.7.0

### Minor Changes

- [#362](https://github.com/Blobscan/blobscan/pull/362) [`4ebf184`](https://github.com/Blobscan/blobscan/commit/4ebf184cbb928a510a0ec201869a9413787a0036) Thanks [@0xGabi](https://github.com/0xGabi)! - Create blob storage state model

- [#345](https://github.com/Blobscan/blobscan/pull/345) [`42ba940`](https://github.com/Blobscan/blobscan/commit/42ba940c15e56e19403755a3218374051540e114) Thanks [@PJColombo](https://github.com/PJColombo)! - Displayed blob as calldata gas fee on transaction page

### Patch Changes

- [#343](https://github.com/Blobscan/blobscan/pull/343) [`206612c`](https://github.com/Blobscan/blobscan/commit/206612c839226972dcac39903e2f327a3207c456) Thanks [@PJColombo](https://github.com/PJColombo)! - Added address filter search query

- [#343](https://github.com/Blobscan/blobscan/pull/343) [`3db8d0e`](https://github.com/Blobscan/blobscan/commit/3db8d0e0526291179b179731a38d3d82767e104c) Thanks [@PJColombo](https://github.com/PJColombo)! - Modified API procedure calls to work with the newly supported search queries introduced in the latest version of `@blobscan/api`

- Updated dependencies [[`206612c`](https://github.com/Blobscan/blobscan/commit/206612c839226972dcac39903e2f327a3207c456), [`7bd5980`](https://github.com/Blobscan/blobscan/commit/7bd59806fe299de53c3476103a54f7c528eb3089), [`3828885`](https://github.com/Blobscan/blobscan/commit/38288856af47de5573b64feeb82c7c9e05b91339), [`4ebf184`](https://github.com/Blobscan/blobscan/commit/4ebf184cbb928a510a0ec201869a9413787a0036), [`b2d1e16`](https://github.com/Blobscan/blobscan/commit/b2d1e16456321c9ab5420114e93173cdaf27d938), [`aeaae7f`](https://github.com/Blobscan/blobscan/commit/aeaae7fdfe1dc800955643fe651cd264a6676b6c), [`7bd5980`](https://github.com/Blobscan/blobscan/commit/7bd59806fe299de53c3476103a54f7c528eb3089)]:
  - @blobscan/api@0.7.0

## 0.6.0

### Minor Changes

- [#355](https://github.com/Blobscan/blobscan/pull/355) [`37539a6`](https://github.com/Blobscan/blobscan/commit/37539a6881e1cffe2cd3e7ef6f1686e6d6f39bd7) Thanks [@0xGabi](https://github.com/0xGabi)! - Added swarm data expiration time to header

### Patch Changes

- Updated dependencies [[`37539a6`](https://github.com/Blobscan/blobscan/commit/37539a6881e1cffe2cd3e7ef6f1686e6d6f39bd7)]:
  - @blobscan/api@0.6.0

## 0.5.2

### Patch Changes

- [#349](https://github.com/Blobscan/blobscan/pull/349) [`f138c01`](https://github.com/Blobscan/blobscan/commit/f138c01d1d656396cc6a48ee79700cd21bc9703f) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for paradex rollup and applied db migrations

- Updated dependencies [[`f138c01`](https://github.com/Blobscan/blobscan/commit/f138c01d1d656396cc6a48ee79700cd21bc9703f)]:
  - @blobscan/api@0.5.3

## 0.5.1

### Patch Changes

- [#347](https://github.com/Blobscan/blobscan/pull/347) [`24846f7`](https://github.com/Blobscan/blobscan/commit/24846f7ce2875ceabd7751f2e9359131e5820933) Thanks [@julien-marchand](https://github.com/julien-marchand)! - Added support for Linea Rollup

- Updated dependencies [[`24846f7`](https://github.com/Blobscan/blobscan/commit/24846f7ce2875ceabd7751f2e9359131e5820933)]:
  - @blobscan/api@0.5.2

## 0.5.0

### Minor Changes

- [#342](https://github.com/Blobscan/blobscan/pull/342) [`3eae290`](https://github.com/Blobscan/blobscan/commit/3eae290014be20c64d56b72feb9c41dbad056684) Thanks [@0xGabi](https://github.com/0xGabi)! - Added new hamburger mobile menu

## 0.4.1

### Patch Changes

- [#329](https://github.com/Blobscan/blobscan/pull/329) [`1c604e1`](https://github.com/Blobscan/blobscan/commit/1c604e101bc54d17a03b90007bae843492124f14) Thanks [@PJColombo](https://github.com/PJColombo)! - Added highlight effect to blob storage badges

- [#341](https://github.com/Blobscan/blobscan/pull/341) [`d27f283`](https://github.com/Blobscan/blobscan/commit/d27f283eef7547b8a86d023b7c6ff147bd3279da) Thanks [@0xGabi](https://github.com/0xGabi)! - Resolved small issues on the UI

- Updated dependencies []:
  - @blobscan/api@0.5.1
  - @blobscan/open-telemetry@0.0.6

## 0.4.0

### Minor Changes

- [#325](https://github.com/Blobscan/blobscan/pull/325) [`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167) Thanks [@mirshko](https://github.com/mirshko)! - Added support for mode and zora rollups

### Patch Changes

- Updated dependencies [[`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167)]:
  - @blobscan/api@0.5.0

## 0.3.4

### Patch Changes

- [#321](https://github.com/Blobscan/blobscan/pull/321) [`a730a33`](https://github.com/Blobscan/blobscan/commit/a730a3322c6dfa33eb63a3f754264cb1a1f066ca) Thanks [@0xGabi](https://github.com/0xGabi)! - Added link to blob data stored on storages

## 0.3.3

### Patch Changes

- [#319](https://github.com/Blobscan/blobscan/pull/319) [`7382165`](https://github.com/Blobscan/blobscan/commit/7382165b7b66bad49e0402a8037d765be05d7158) Thanks [@0xGabi](https://github.com/0xGabi)! - Enhanced dark mode badges

## 0.3.2

### Patch Changes

- [#317](https://github.com/Blobscan/blobscan/pull/317) [`4e50b54`](https://github.com/Blobscan/blobscan/commit/4e50b545d0448bffbdb0a58f5b894909a65ace01) Thanks [@0xGabi](https://github.com/0xGabi)! - Added gap between storage badges

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @blobscan/api@0.4.2
  - @blobscan/open-telemetry@0.0.5

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

- [#295](https://github.com/Blobscan/blobscan/pull/295) [`b307c59`](https://github.com/Blobscan/blobscan/commit/b307c59cace1858634b0bf54099338429c69ce63) Thanks [@0xGabi](https://github.com/0xGabi)! - Split getByBlockId schema to handle openapi parse restrictions

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
