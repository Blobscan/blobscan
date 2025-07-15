# @blobscan/api

## 1.0.0

### Patch Changes

- [#842](https://github.com/Blobscan/blobscan/pull/842) [`02ef0a0`](https://github.com/Blobscan/blobscan/commit/02ef0a00401dc5f0d9f591f23ed0187060189431) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved an issue where blob index was being overwritten by transaction index when returning a single blob

- [#839](https://github.com/Blobscan/blobscan/pull/839) [`5c786c5`](https://github.com/Blobscan/blobscan/commit/5c786c5c521a7f44f8bc88d5622fc26f311a2dfb) Thanks [@PJColombo](https://github.com/PJColombo)! - Sorted blob data storage references in blob response

- Updated dependencies [[`3518952`](https://github.com/Blobscan/blobscan/commit/3518952f41d9c0a221e30c33a58578dde6fd1ed9)]:
  - @blobscan/blob-propagator@0.4.0

## 0.24.0

### Minor Changes

- [#831](https://github.com/Blobscan/blobscan/pull/831) [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed exposed singleton instance of Blob Propagator; consumers must now instantiate it manually

- [#831](https://github.com/Blobscan/blobscan/pull/831) [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e) Thanks [@PJColombo](https://github.com/PJColombo)! - Added separate router entrypoints for Web and REST API apps

- [#831](https://github.com/Blobscan/blobscan/pull/831) [`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed exposed singleton instance of Blob Storage Manager; consumers must now instantiate it manually

### Patch Changes

- [#814](https://github.com/Blobscan/blobscan/pull/814) [`095564d`](https://github.com/Blobscan/blobscan/commit/095564d18b1200243ea272df1be55c4567978834) Thanks [@xFJA](https://github.com/xFJA)! - Updated Chunkstorm endpoint

- Updated dependencies [[`a0e25c0`](https://github.com/Blobscan/blobscan/commit/a0e25c0a1d51d382b6083bd6476e7923a9931c1e), [`f64d961`](https://github.com/Blobscan/blobscan/commit/f64d961a166cc6fe4ae9397d2d54b24c3764f13d), [`a550799`](https://github.com/Blobscan/blobscan/commit/a550799462d4d657ef6e1f50155c3efe55e39759), [`52b89d6`](https://github.com/Blobscan/blobscan/commit/52b89d6a90200eea5647c49bb5fba8c0b0ff1529)]:
  - @blobscan/blob-propagator@0.3.0
  - @blobscan/network-blob-config@0.3.0
  - @blobscan/env@0.2.0
  - @blobscan/db@0.18.1
  - @blobscan/logger@0.1.3
  - @blobscan/open-telemetry@0.0.10

## 0.23.0

### Minor Changes

- [#781](https://github.com/Blobscan/blobscan/pull/781) [`3564e6e`](https://github.com/Blobscan/blobscan/commit/3564e6e79bc187b6bcb8cf99d901dfd9b233afb2) Thanks [@PJColombo](https://github.com/PJColombo)! - Introduced `category` and `rollup` query parameters to daily and overall stats procedures for filtering stats and metrics

- [#685](https://github.com/Blobscan/blobscan/pull/685) [`46a9699`](https://github.com/Blobscan/blobscan/commit/46a96994f5fd01ff1cf109f2c561203bfb475f50) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added procedure to retrieve overall app state (eth usd prices, sync state and latest block)

- [#685](https://github.com/Blobscan/blobscan/pull/685) [`46a9699`](https://github.com/Blobscan/blobscan/commit/46a96994f5fd01ff1cf109f2c561203bfb475f50) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added eth price retrieval procedure

- [#781](https://github.com/Blobscan/blobscan/pull/781) [`3564e6e`](https://github.com/Blobscan/blobscan/commit/3564e6e79bc187b6bcb8cf99d901dfd9b233afb2) Thanks [@PJColombo](https://github.com/PJColombo)! - Updates overall stats procedures to to return a set of overall stats elements instead of a single item.

### Patch Changes

- [#802](https://github.com/Blobscan/blobscan/pull/802) [`783216a`](https://github.com/Blobscan/blobscan/commit/783216ad98c611c84642fa776a9ea35db3d97d5e) Thanks [@PJColombo](https://github.com/PJColombo)! - Improved daily stats sampling fetching performance

- [#802](https://github.com/Blobscan/blobscan/pull/802) [`783216a`](https://github.com/Blobscan/blobscan/commit/783216ad98c611c84642fa776a9ea35db3d97d5e) Thanks [@PJColombo](https://github.com/PJColombo)! - Returned full amount of daily stats when the number of requested stats is limited

- Updated dependencies [[`ec6f24f`](https://github.com/Blobscan/blobscan/commit/ec6f24f9a24114be0fd973f30eb1d67b683e0f73), [`9a78399`](https://github.com/Blobscan/blobscan/commit/9a783998bac9c6e9f929a89f0e685b8745edd3ac), [`052da7e`](https://github.com/Blobscan/blobscan/commit/052da7e93a3c3289ec67097b8f8bc34315d84b2e)]:
  - @blobscan/blob-storage-manager@0.5.0
  - @blobscan/network-blob-config@0.2.0
  - @blobscan/db@0.18.0
  - @blobscan/blob-propagator@0.2.13
  - @blobscan/rollups@0.3.3

## 0.22.0

### Minor Changes

- [#791](https://github.com/Blobscan/blobscan/pull/791) [`969ab8f`](https://github.com/Blobscan/blobscan/commit/969ab8f757b77698ebd855425541ef209295d3c8) Thanks [@PJColombo](https://github.com/PJColombo)! - Added blob storage references field to block and transaction API responses by default

## 0.21.0

### Minor Changes

- [#762](https://github.com/Blobscan/blobscan/pull/762) [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added API key authentication to the `getBlobDataByBlobId` procedure

- [#762](https://github.com/Blobscan/blobscan/pull/762) [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Dropped the blob data field from API responses to reduce payload size

- [#743](https://github.com/Blobscan/blobscan/pull/743) [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92) Thanks [@PJColombo](https://github.com/PJColombo)! - Added missing transaction gas fee fields (blob gas base fee, blob gas max fee, and blob as calldata gas fee) to the expanded transaction object in the blob RPC procedures

- [#762](https://github.com/Blobscan/blobscan/pull/762) [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Updated `getBlobDataByBlobId` procedure to retrieve blob data from the database only.

- [#743](https://github.com/Blobscan/blobscan/pull/743) [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92) Thanks [@PJColombo](https://github.com/PJColombo)! - Improved transaction RPC procedures to return a parsed decodedFields object instead of a stringified version

- [#762](https://github.com/Blobscan/blobscan/pull/762) [`c4a2693`](https://github.com/Blobscan/blobscan/commit/c4a26939cd270c3f9bc5c57d37a01f83f59981fc) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Dropped `blob_data` value from expand query param

- [#743](https://github.com/Blobscan/blobscan/pull/743) [`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92) Thanks [@PJColombo](https://github.com/PJColombo)! - Returned all Prisma DecimalJS fields as bigints across all procedures

### Patch Changes

- Updated dependencies [[`186aa87`](https://github.com/Blobscan/blobscan/commit/186aa873c0970d9717cb04db1a6ad4adeb1faf92)]:
  - @blobscan/db@0.17.0
  - @blobscan/blob-propagator@0.2.12
  - @blobscan/blob-storage-manager@0.4.4
  - @blobscan/rollups@0.3.2

## 0.20.0

### Minor Changes

- [#732](https://github.com/Blobscan/blobscan/pull/732) [`b6217e8`](https://github.com/Blobscan/blobscan/commit/b6217e810f77d105df356b866d5df432a96d88ab) Thanks [@xFJA](https://github.com/xFJA)! - Added stat endpoint to return blobs per rollup data.

### Patch Changes

- Updated dependencies [[`29b205a`](https://github.com/Blobscan/blobscan/commit/29b205a0e096a7cf42f26554c2f4818c94303295)]:
  - @blobscan/db@0.16.0
  - @blobscan/blob-propagator@0.2.11
  - @blobscan/blob-storage-manager@0.4.3
  - @blobscan/rollups@0.3.1

## 0.19.0

### Minor Changes

- [#730](https://github.com/Blobscan/blobscan/pull/730) [`8e4633e`](https://github.com/Blobscan/blobscan/commit/8e4633eee4c0b736819d56ef6dc701d3df42d04d) Thanks [@PJColombo](https://github.com/PJColombo)! - Added following rollups: abstract, aevo, ancient8, arenaz, bob, debankchain, ethernity, fraxtal, fuel, hashkey, hemi, hypr, infinaeon, ink, karak, kinto, lambda, lisk, manta, mantle, metamail, metis, mint, morph, nal, nanonnetwork, opbnb, optopia, orderly, pandasea, parallel, phala, polynomial, r0ar, race, rari, shape, snaxchain, soneium, superlumio, superseed, swanchain, swellchain, unichain, world, xga, zeronetwork and zircuit

- [#739](https://github.com/Blobscan/blobscan/pull/739) [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed the `category` field from the `Transaction` model and now derive its value from the `rollup` field

- [#739](https://github.com/Blobscan/blobscan/pull/739) [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf) Thanks [@PJColombo](https://github.com/PJColombo)! - Dropped `category` from `Transaction` model and computed it from `rollup` field

- [#739](https://github.com/Blobscan/blobscan/pull/739) [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf) Thanks [@PJColombo](https://github.com/PJColombo)! - Reallocated the `rollup` field from the `Transaction` model to the `Address` model

- [#739](https://github.com/Blobscan/blobscan/pull/739) [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf) Thanks [@PJColombo](https://github.com/PJColombo)! - Dropped `AddressCategoryInfo` and added its columns to `Address` model

### Patch Changes

- Updated dependencies [[`8e4633e`](https://github.com/Blobscan/blobscan/commit/8e4633eee4c0b736819d56ef6dc701d3df42d04d), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf), [`82ca4dd`](https://github.com/Blobscan/blobscan/commit/82ca4dd8b01b275bedbfca5dcc918f6acc4ecfdf)]:
  - @blobscan/rollups@0.3.0
  - @blobscan/db@0.15.0
  - @blobscan/blob-propagator@0.2.10
  - @blobscan/blob-storage-manager@0.4.2

## 0.18.1

### Patch Changes

- [#722](https://github.com/Blobscan/blobscan/pull/722) [`1ab2c7f`](https://github.com/Blobscan/blobscan/commit/1ab2c7fddce9883b81387bce0e11ac8104c7d983) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed `sort` query param from `getBySlot` procedure

## 0.18.0

### Minor Changes

- [#721](https://github.com/Blobscan/blobscan/pull/721) [`242af90`](https://github.com/Blobscan/blobscan/commit/242af90b145ec95277172dc1a74ebb222231e58a) Thanks [@PJColombo](https://github.com/PJColombo)! - Added last upper synced block root and block slot fields

- [#700](https://github.com/Blobscan/blobscan/pull/700) [`b90971b`](https://github.com/Blobscan/blobscan/commit/b90971b1415e32c23c530feff1fc2dd1560d377d) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for fetching blocks by slot

- [#713](https://github.com/Blobscan/blobscan/pull/713) [`27cddc4`](https://github.com/Blobscan/blobscan/commit/27cddc45aeb593d1dd9a1c693d5bfe69b6569f9a) Thanks [@PJColombo](https://github.com/PJColombo)! - Renamed and modified handleReorgedSlots to handleReorg, which now receives a set of rewinded and forwarded block hashes.

### Patch Changes

- [#695](https://github.com/Blobscan/blobscan/pull/695) [`9f88066`](https://github.com/Blobscan/blobscan/commit/9f88066f7445d3bfddc9088fe7078a9d53d9828e) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added sorting option to the getDailyStats API endpoint

- [#658](https://github.com/Blobscan/blobscan/pull/658) [`95f8043`](https://github.com/Blobscan/blobscan/commit/95f8043f253e83d37e224ccfd63f4c61088af4c2) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Removed auto-completion logic for hashes in Optimism decoded fields retrieval

- Updated dependencies [[`242af90`](https://github.com/Blobscan/blobscan/commit/242af90b145ec95277172dc1a74ebb222231e58a)]:
  - @blobscan/db@0.14.0
  - @blobscan/blob-propagator@0.2.9
  - @blobscan/blob-storage-manager@0.4.1
  - @blobscan/rollups@0.2.3

## 0.17.1

### Patch Changes

- [#689](https://github.com/Blobscan/blobscan/pull/689) [`a04245e`](https://github.com/Blobscan/blobscan/commit/a04245e23afe8e783ed8be81c34b98e6f5fc02b0) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for parameterizing the WeaveVm blob data storage reference base URL

## 0.17.0

### Minor Changes

- [#681](https://github.com/Blobscan/blobscan/pull/681) [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256) Thanks [@PJColombo](https://github.com/PJColombo)! - Added Weavevm blob storage support

- [#683](https://github.com/Blobscan/blobscan/pull/683) [`6a06872`](https://github.com/Blobscan/blobscan/commit/6a06872d13de893f821200b3541567b413916c9a) Thanks [@PJColombo](https://github.com/PJColombo)! - Added a protected procedure to upsert weaveVM blob storage references

### Patch Changes

- Updated dependencies [[`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202), [`e1421f6`](https://github.com/Blobscan/blobscan/commit/e1421f64443ee6c9395bdc43e0cd29e7fc81e256), [`e4dbe7a`](https://github.com/Blobscan/blobscan/commit/e4dbe7aa80b8bb885942cebb122c00e503db8202)]:
  - @blobscan/db@0.13.0
  - @blobscan/blob-storage-manager@0.4.0
  - @blobscan/env@0.1.0
  - @blobscan/blob-propagator@0.2.8
  - @blobscan/rollups@0.2.2
  - @blobscan/logger@0.1.2
  - @blobscan/open-telemetry@0.0.9

## 0.16.0

### Minor Changes

- [#623](https://github.com/Blobscan/blobscan/pull/623) [`025484b`](https://github.com/Blobscan/blobscan/commit/025484be6b12344cfa5a40cda963827aa60cb1e3) Thanks [@xFJA](https://github.com/xFJA)! - Added transaction category column to blob data.

- [#637](https://github.com/Blobscan/blobscan/pull/637) [`ca30a0f`](https://github.com/Blobscan/blobscan/commit/ca30a0f03c11dfc0c4a25d18fdde2365458b17ca) Thanks [@xFJA](https://github.com/xFJA)! - Remove nullable rollup value on filters.

- [#637](https://github.com/Blobscan/blobscan/pull/637) [`ca30a0f`](https://github.com/Blobscan/blobscan/commit/ca30a0f03c11dfc0c4a25d18fdde2365458b17ca) Thanks [@xFJA](https://github.com/xFJA)! - Added 'Category' filter for blobs, blocks and transactions.

### Patch Changes

- [#643](https://github.com/Blobscan/blobscan/pull/643) [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved an issue where blocks flagged as reorged remained marked as reorged after being reindexed

- Updated dependencies [[`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`6512745`](https://github.com/Blobscan/blobscan/commit/6512745dc20949837a37aa923766f8b7effd6816), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea), [`0922d8b`](https://github.com/Blobscan/blobscan/commit/0922d8ba3af90b9d798db5a3e83d3b2203c00af5), [`c88e11f`](https://github.com/Blobscan/blobscan/commit/c88e11f223df7543ae28c0d7e998c8e20c5690ea)]:
  - @blobscan/db@0.12.0
  - @blobscan/blob-propagator@0.2.7
  - @blobscan/blob-storage-manager@0.3.7
  - @blobscan/rollups@0.2.1

## 0.15.0

### Minor Changes

- [#592](https://github.com/Blobscan/blobscan/pull/592) [`76bd799`](https://github.com/Blobscan/blobscan/commit/76bd7990ea36b2826924cdbec6ddc660e96b1a17) Thanks [@xFJA](https://github.com/xFJA)! - Added the possibility to filter by multiple `from` addresses

## 0.14.0

### Minor Changes

- [#529](https://github.com/Blobscan/blobscan/pull/529) [`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Displayed Optimism decoded blob data

### Patch Changes

- [#590](https://github.com/Blobscan/blobscan/pull/590) [`dd75d56`](https://github.com/Blobscan/blobscan/commit/dd75d56d8ce2ef881c55ac843d9e9937939d671b) Thanks [@PJColombo](https://github.com/PJColombo)! - Optimized element count performance by retrieving pre-calculated values from the stats table when filtering by rollup, date, or with no filters applied

- Updated dependencies [[`c3cfd46`](https://github.com/Blobscan/blobscan/commit/c3cfd46cfe65c35ef2bfa0464951cdd78c1a51b8), [`78468dd`](https://github.com/Blobscan/blobscan/commit/78468ddcb6b30b889dfcd8cf87f8770202143efc)]:
  - @blobscan/rollups@0.2.0
  - @blobscan/db@0.11.0
  - @blobscan/blob-propagator@0.2.6
  - @blobscan/blob-storage-manager@0.3.6

## 0.13.0

### Minor Changes

- [#551](https://github.com/Blobscan/blobscan/pull/551) [`7240bba`](https://github.com/Blobscan/blobscan/commit/7240bba44dfa65d208cd027d723d9fb7a2f988f7) Thanks [@PJColombo](https://github.com/PJColombo)! - Added `category` column to `Transaction` model

- [#446](https://github.com/Blobscan/blobscan/pull/446) [`c6dba39`](https://github.com/Blobscan/blobscan/commit/c6dba39665ce1df135d1f4b6ae2a324a936370b3) Thanks [@PJColombo](https://github.com/PJColombo)! - Updated the references to now return a URL instead of a URI.

- [#577](https://github.com/Blobscan/blobscan/pull/577) [`dc3afe7`](https://github.com/Blobscan/blobscan/commit/dc3afe795cebba83d7637f4c2866aafbcf009309) Thanks [@PJColombo](https://github.com/PJColombo)! - Introduced a new query parameter, count, that allows consumers to enable item counting in all procedures for retrieving blobs, blocks, and transactions.

- [#470](https://github.com/Blobscan/blobscan/pull/470) [`4bc7884`](https://github.com/Blobscan/blobscan/commit/4bc78848b57d2c2cfe6053a34ec2bc3e85cacfcf) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Added procedure to get the latest block

- [#576](https://github.com/Blobscan/blobscan/pull/576) [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for category and rollup aggregations

- [#447](https://github.com/Blobscan/blobscan/pull/447) [`a84b544`](https://github.com/Blobscan/blobscan/commit/a84b5443b32e5a5cea76cedb2ba50c11742f24a7) Thanks [@PJColombo](https://github.com/PJColombo)! - Added `getBlobDataByBlobId` procedure

- [#581](https://github.com/Blobscan/blobscan/pull/581) [`bd8a4cb`](https://github.com/Blobscan/blobscan/commit/bd8a4cbb0840780b95c48fbdcaa68c711242558d) Thanks [@PJColombo](https://github.com/PJColombo)! - Added procedures to count total amount of blobs, blocks or txs given a set of filters

### Patch Changes

- [#567](https://github.com/Blobscan/blobscan/pull/567) [`bbf5111`](https://github.com/Blobscan/blobscan/commit/bbf5111afe84d70ada171de191f7095d2af518da) Thanks [@luis-herasme](https://github.com/luis-herasme)! - Fixed pagination count for blob search

- [#532](https://github.com/Blobscan/blobscan/pull/532) [`03fb6b0`](https://github.com/Blobscan/blobscan/commit/03fb6b0d3291a85e80cbdab6cb497b782b17e7e8) Thanks [@PJColombo](https://github.com/PJColombo)! - Corrected the transaction indexing process to resolve the transaction sender instead of the receiver when looking for rollup transactions.

- [#559](https://github.com/Blobscan/blobscan/pull/559) [`3507a88`](https://github.com/Blobscan/blobscan/commit/3507a88edc5a9648664fba59f78481ecdc4ca77b) Thanks [@PJColombo](https://github.com/PJColombo)! - Added blob gas used to `Transaction` model

- [#584](https://github.com/Blobscan/blobscan/pull/584) [`6eb69e8`](https://github.com/Blobscan/blobscan/commit/6eb69e8c6ba1450519b13c12255749fd36c62bee) Thanks [@PJColombo](https://github.com/PJColombo)! - Enhanced blob fetching performance by adding sorting based on block timestamps and transaction index

- Updated dependencies [[`7240bba`](https://github.com/Blobscan/blobscan/commit/7240bba44dfa65d208cd027d723d9fb7a2f988f7), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`04565b2`](https://github.com/Blobscan/blobscan/commit/04565b28b4dd27dae6800f059959cc7d0d3e1026), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`16870e4`](https://github.com/Blobscan/blobscan/commit/16870e45df3d633e1dfae125704d7a33868c733f), [`6eb69e8`](https://github.com/Blobscan/blobscan/commit/6eb69e8c6ba1450519b13c12255749fd36c62bee), [`3507a88`](https://github.com/Blobscan/blobscan/commit/3507a88edc5a9648664fba59f78481ecdc4ca77b)]:
  - @blobscan/db@0.10.0
  - @blobscan/rollups@0.1.0
  - @blobscan/dayjs@0.1.0
  - @blobscan/blob-propagator@0.2.5
  - @blobscan/blob-storage-manager@0.3.5

## 0.12.0

### Minor Changes

- [#444](https://github.com/Blobscan/blobscan/pull/444) [`8d27043`](https://github.com/Blobscan/blobscan/commit/8d27043ea464c34cfeef29ae996fca0ee6d2c1ab) Thanks [@PJColombo](https://github.com/PJColombo)! - Moved tx rollup, index and blob index field to expandable fields in block retrieval

- [#442](https://github.com/Blobscan/blobscan/pull/442) [`634274b`](https://github.com/Blobscan/blobscan/commit/634274bd0940f081d8faa54fd68a892e450ae7ad) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support to filter entities (blobs, blocks or transactions) by no rollup

### Patch Changes

- Updated dependencies [[`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7), [`de3ceb5`](https://github.com/Blobscan/blobscan/commit/de3ceb5c9f2130ba407c64effe744f214fd6cad7)]:
  - @blobscan/db@0.9.0
  - @blobscan/blob-propagator@0.2.4
  - @blobscan/blob-storage-manager@0.3.4

## 0.11.0

### Minor Changes

- [#441](https://github.com/Blobscan/blobscan/pull/441) [`f86465f`](https://github.com/Blobscan/blobscan/commit/f86465f88fb46150b5fbf7623a9d7242c06490c2) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed block timestamp and number from block expanded fields as all entities (transaction and blob) already this block fields

### Patch Changes

- [#439](https://github.com/Blobscan/blobscan/pull/439) [`28a9642`](https://github.com/Blobscan/blobscan/commit/28a96423215afdfeb89850d2ebcb17180f3ff7c4) Thanks [@PJColombo](https://github.com/PJColombo)! - Performed sorting of block's transactions and blobs directly in the db query instead of during serialization

## 0.10.0

### Minor Changes

- [#422](https://github.com/Blobscan/blobscan/pull/422) [`a00fdbb`](https://github.com/Blobscan/blobscan/commit/a00fdbb08a5d17a07e7a4f759572fd598ccf7ce7) Thanks [@PJColombo](https://github.com/PJColombo)! - Introduced block number and timestamp columns to the transaction table, enabling faster and more efficient sorting and filtering when retrieving multiple transactions.

- [#415](https://github.com/Blobscan/blobscan/pull/415) [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Dropped average blob size stat

- [#423](https://github.com/Blobscan/blobscan/pull/423) [`e2bc7cc`](https://github.com/Blobscan/blobscan/commit/e2bc7ccb0cedf74fd1811f6ba76f672d67218e84) Thanks [@PJColombo](https://github.com/PJColombo)! - Introduced block number and timestamp fields to the `BlobsOnTransactions` model, enabling faster and more efficient sorting and filtering when retrieving multiple blobs.

- [#424](https://github.com/Blobscan/blobscan/pull/424) [`097f5d5`](https://github.com/Blobscan/blobscan/commit/097f5d5be60a2bfb82faf8731e1901144abf125a) Thanks [@PJColombo](https://github.com/PJColombo)! - Added transaction index

### Patch Changes

- [#412](https://github.com/Blobscan/blobscan/pull/412) [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Replaced local environment variables with the `@blobscan/env` package

- [#424](https://github.com/Blobscan/blobscan/pull/424) [`89d80a8`](https://github.com/Blobscan/blobscan/commit/89d80a83257659074c6e3da2e4dfb0f87842a5b8) Thanks [@PJColombo](https://github.com/PJColombo)! - Changed the sorting criteria for transactions and blobs within the same block to index-based instead of hash-based

- Updated dependencies [[`a00fdbb`](https://github.com/Blobscan/blobscan/commit/a00fdbb08a5d17a07e7a4f759572fd598ccf7ce7), [`3e15dd1`](https://github.com/Blobscan/blobscan/commit/3e15dd1bc074cde951aedf307fdbdb668bcc081b), [`253e5c4`](https://github.com/Blobscan/blobscan/commit/253e5c480f988993730b30197444a63c39fc9735), [`28da372`](https://github.com/Blobscan/blobscan/commit/28da372f217ce44cb7e16cd02bcc02633576879a), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`cd96277`](https://github.com/Blobscan/blobscan/commit/cd96277acf3a2e25f6ca1332fc66283cfd95f673), [`363a5aa`](https://github.com/Blobscan/blobscan/commit/363a5aae45e087b8938325a472e2c1c1dcfde42d), [`49455b8`](https://github.com/Blobscan/blobscan/commit/49455b86282dac56692085751e28494773e274ae), [`e2bc7cc`](https://github.com/Blobscan/blobscan/commit/e2bc7ccb0cedf74fd1811f6ba76f672d67218e84), [`097f5d5`](https://github.com/Blobscan/blobscan/commit/097f5d5be60a2bfb82faf8731e1901144abf125a)]:
  - @blobscan/db@0.8.0
  - @blobscan/blob-storage-manager@0.3.3
  - @blobscan/blob-propagator@0.2.3
  - @blobscan/open-telemetry@0.0.8
  - @blobscan/logger@0.1.1

## 0.9.2

### Patch Changes

- [#407](https://github.com/Blobscan/blobscan/pull/407) [`274e838`](https://github.com/Blobscan/blobscan/commit/274e838c71e7364068cc4c156e2f310cb58122ee) Thanks [@PJColombo](https://github.com/PJColombo)! - Ensure `transactions` and `blobs` input are not empty on `indexData` procedure

- [#407](https://github.com/Blobscan/blobscan/pull/407) [`274e838`](https://github.com/Blobscan/blobscan/commit/274e838c71e7364068cc4c156e2f310cb58122ee) Thanks [@PJColombo](https://github.com/PJColombo)! - Resolved issue where the reorg handling procedure wasn't processing db operation results correctly

- Updated dependencies [[`4ff5c4d`](https://github.com/Blobscan/blobscan/commit/4ff5c4d720463fd607a32fe35466a3e0dad045f9)]:
  - @blobscan/db@0.7.0
  - @blobscan/blob-propagator@0.2.2
  - @blobscan/blob-storage-manager@0.3.2

## 0.9.1

### Patch Changes

- [#401](https://github.com/Blobscan/blobscan/pull/401) [`2d59e7a`](https://github.com/Blobscan/blobscan/commit/2d59e7a62ac5167f8bd458df68acbc21fdac4e52) Thanks [@PJColombo](https://github.com/PJColombo)! - Enhanced blob data retrieval by trying to fetch data by versioned hash and/or blob data storage references

## 0.9.0

### Minor Changes

- [#398](https://github.com/Blobscan/blobscan/pull/398) [`9d2e6ac`](https://github.com/Blobscan/blobscan/commit/9d2e6aca545a3dde9be5742afbe71b12d675420c) Thanks [@0xGabi](https://github.com/0xGabi)! - Added sepolia new rollups

### Patch Changes

- Updated dependencies [[`9d2e6ac`](https://github.com/Blobscan/blobscan/commit/9d2e6aca545a3dde9be5742afbe71b12d675420c), [`fad721d`](https://github.com/Blobscan/blobscan/commit/fad721de28cb131ed988a1f2333d7b35e8261df2), [`c4c94f4`](https://github.com/Blobscan/blobscan/commit/c4c94f453146beefe853dfedf8681db472155c34), [`fad721d`](https://github.com/Blobscan/blobscan/commit/fad721de28cb131ed988a1f2333d7b35e8261df2), [`4aa1198`](https://github.com/Blobscan/blobscan/commit/4aa1198d2f3d4387f9cabb2b791a7a2b8b863938)]:
  - @blobscan/db@0.6.0
  - @blobscan/blob-storage-manager@0.3.1
  - @blobscan/blob-propagator@0.2.1

## 0.8.1

### Patch Changes

- [#380](https://github.com/Blobscan/blobscan/pull/380) [`737272d`](https://github.com/Blobscan/blobscan/commit/737272d6312bd478b1662133b875b50457694f10) Thanks [@PJColombo](https://github.com/PJColombo)! - Enhanced the indexing procedure to be idempotent, allowing for re-propagation of already-indexed blob data

- [#395](https://github.com/Blobscan/blobscan/pull/395) [`ffbb8e6`](https://github.com/Blobscan/blobscan/commit/ffbb8e6074878e30c9aa5ac8e774dbbb8060fb96) Thanks [@PJColombo](https://github.com/PJColombo)! - Improved error handling by surfacing causes of context creation failures

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`57723f3`](https://github.com/Blobscan/blobscan/commit/57723f351f4a63a5b86558e447ee5d6fe2f947c8) Thanks [@PJColombo](https://github.com/PJColombo)! - Fixed blob propagator import

- [#387](https://github.com/Blobscan/blobscan/pull/387) [`1cce838`](https://github.com/Blobscan/blobscan/commit/1cce8387e28488946b83c5a8a36a2e0db1d595c9) Thanks [@0xGabi](https://github.com/0xGabi)! - Added new rollup addresses to indexer

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`d7a760d`](https://github.com/Blobscan/blobscan/commit/d7a760da302ce01f1f6f1072d98a10cc100dc1f5) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for retrieving blob data by hash in addition to by its references.

- Updated dependencies [[`0a61aec`](https://github.com/Blobscan/blobscan/commit/0a61aec545fa1b3b7a44b2a7c9e9a8e8250c1362), [`67a7472`](https://github.com/Blobscan/blobscan/commit/67a7472e14e4488a9425016e11fd52f963b570ef), [`b1141b1`](https://github.com/Blobscan/blobscan/commit/b1141b1ca369ee8c3d02c4cb3dd4e47ebca08120), [`72e4b96`](https://github.com/Blobscan/blobscan/commit/72e4b963e2e735156032467554e6cc3cd311097e), [`ba066e0`](https://github.com/Blobscan/blobscan/commit/ba066e0db6b19ae1056ecc17c3b42acc64627a7f), [`52804b1`](https://github.com/Blobscan/blobscan/commit/52804b1a71c645242719230b3d68240b6a30687a), [`40824c2`](https://github.com/Blobscan/blobscan/commit/40824c26f6d8a360592c812bd1afe505d9fc4f6d), [`7bb6f49`](https://github.com/Blobscan/blobscan/commit/7bb6f4912c89d0dd436e325677c801200e32edba), [`514784a`](https://github.com/Blobscan/blobscan/commit/514784a743937dc2d1af1ed533e90fef3b3aa057), [`a5bc257`](https://github.com/Blobscan/blobscan/commit/a5bc257090fd6c832b3379b56281c82db5936a01), [`5ffb8ca`](https://github.com/Blobscan/blobscan/commit/5ffb8ca355bfcd02393a3b40e89b9d7a1a5a05e8), [`89df217`](https://github.com/Blobscan/blobscan/commit/89df217e817727a710a7c3217ad7be4750de93ce), [`95fbf74`](https://github.com/Blobscan/blobscan/commit/95fbf7471f5e5cacec7513f0736a70a18f971ce1), [`7c95fdd`](https://github.com/Blobscan/blobscan/commit/7c95fddb50e4939844a933ded836916792e07323), [`d7a760d`](https://github.com/Blobscan/blobscan/commit/d7a760da302ce01f1f6f1072d98a10cc100dc1f5), [`db1d90a`](https://github.com/Blobscan/blobscan/commit/db1d90a95ebd633620c667d96c42a6a2ea6ef814), [`d42f1a9`](https://github.com/Blobscan/blobscan/commit/d42f1a9e7dffc5a204c067251947db25cdbc3cf1), [`db42b53`](https://github.com/Blobscan/blobscan/commit/db42b539582d2b9a19339bd3b9b610d5d90b71b9), [`7e2d4d0`](https://github.com/Blobscan/blobscan/commit/7e2d4d0f601127c00ade2f01e4936579463230fd), [`40824c2`](https://github.com/Blobscan/blobscan/commit/40824c26f6d8a360592c812bd1afe505d9fc4f6d), [`b4e8d2c`](https://github.com/Blobscan/blobscan/commit/b4e8d2cd63d4f2b307f21848c23da14acc265ab0), [`0570eee`](https://github.com/Blobscan/blobscan/commit/0570eee9a4d30f5c07cef177ba79cd1798992761)]:
  - @blobscan/logger@0.1.0
  - @blobscan/blob-storage-manager@0.3.0
  - @blobscan/zod@0.1.0
  - @blobscan/blob-propagator@0.2.0
  - @blobscan/db@0.5.0
  - @blobscan/open-telemetry@0.0.7

## 0.8.0

### Minor Changes

- [#358](https://github.com/Blobscan/blobscan/pull/358) [`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8) Thanks [@PJColombo](https://github.com/PJColombo)! - Added file system blob storage

### Patch Changes

- Updated dependencies [[`b50d0be`](https://github.com/Blobscan/blobscan/commit/b50d0be3ca660eb8d0c46df2e6f3b9d5d212b4b4), [`d8551d2`](https://github.com/Blobscan/blobscan/commit/d8551d2eeea50fde3c6fbc4f4773c59be89a44a8)]:
  - @blobscan/blob-storage-manager@0.2.0
  - @blobscan/blob-propagator@0.1.0
  - @blobscan/db@0.4.0

## 0.7.0

### Minor Changes

- [#343](https://github.com/Blobscan/blobscan/pull/343) [`206612c`](https://github.com/Blobscan/blobscan/commit/206612c839226972dcac39903e2f327a3207c456) Thanks [@PJColombo](https://github.com/PJColombo)! - Added address filter search query

- [#343](https://github.com/Blobscan/blobscan/pull/343) [`7bd5980`](https://github.com/Blobscan/blobscan/commit/7bd59806fe299de53c3476103a54f7c528eb3089) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support to filter results by rollup, slot range and block number range

- [#343](https://github.com/Blobscan/blobscan/pull/343) [`3828885`](https://github.com/Blobscan/blobscan/commit/38288856af47de5573b64feeb82c7c9e05b91339) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support to filter blobs, blocks and transactions by date range

- [#362](https://github.com/Blobscan/blobscan/pull/362) [`4ebf184`](https://github.com/Blobscan/blobscan/commit/4ebf184cbb928a510a0ec201869a9413787a0036) Thanks [@0xGabi](https://github.com/0xGabi)! - Added blob storage state router

- [#345](https://github.com/Blobscan/blobscan/pull/345) [`b2d1e16`](https://github.com/Blobscan/blobscan/commit/b2d1e16456321c9ab5420114e93173cdaf27d938) Thanks [@PJColombo](https://github.com/PJColombo)! - Added blob as calldata gas fee field to returned transaction resource

- [#343](https://github.com/Blobscan/blobscan/pull/343) [`aeaae7f`](https://github.com/Blobscan/blobscan/commit/aeaae7fdfe1dc800955643fe651cd264a6676b6c) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support to expanding linked resources within a resource via a new `expand` search param

- [#343](https://github.com/Blobscan/blobscan/pull/343) [`7bd5980`](https://github.com/Blobscan/blobscan/commit/7bd59806fe299de53c3476103a54f7c528eb3089) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for sorting results in ascending (asc) and descending (desc) order

## 0.6.0

### Minor Changes

- [#355](https://github.com/Blobscan/blobscan/pull/355) [`37539a6`](https://github.com/Blobscan/blobscan/commit/37539a6881e1cffe2cd3e7ef6f1686e6d6f39bd7) Thanks [@0xGabi](https://github.com/0xGabi)! - Added new procedure to fetch swarm state

### Patch Changes

- Updated dependencies [[`37539a6`](https://github.com/Blobscan/blobscan/commit/37539a6881e1cffe2cd3e7ef6f1686e6d6f39bd7)]:
  - @blobscan/blob-storage-manager@0.1.0
  - @blobscan/blob-propagator@0.0.9

## 0.5.4

### Patch Changes

- Updated dependencies [[`fc6298f`](https://github.com/Blobscan/blobscan/commit/fc6298fcbdc17b89bd0289ddd1f8d252870cd402)]:
  - @blobscan/blob-storage-manager@0.0.8
  - @blobscan/blob-propagator@0.0.8

## 0.5.3

### Patch Changes

- [#349](https://github.com/Blobscan/blobscan/pull/349) [`f138c01`](https://github.com/Blobscan/blobscan/commit/f138c01d1d656396cc6a48ee79700cd21bc9703f) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for paradex rollup and applied db migrations

- Updated dependencies [[`f138c01`](https://github.com/Blobscan/blobscan/commit/f138c01d1d656396cc6a48ee79700cd21bc9703f)]:
  - @blobscan/db@0.3.3

## 0.5.2

### Patch Changes

- [#347](https://github.com/Blobscan/blobscan/pull/347) [`24846f7`](https://github.com/Blobscan/blobscan/commit/24846f7ce2875ceabd7751f2e9359131e5820933) Thanks [@julien-marchand](https://github.com/julien-marchand)! - Added support for Linea Rollup

- Updated dependencies [[`24846f7`](https://github.com/Blobscan/blobscan/commit/24846f7ce2875ceabd7751f2e9359131e5820933)]:
  - @blobscan/db@0.3.2

## 0.5.1

### Patch Changes

- Updated dependencies [[`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5), [`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5), [`f62f1a2`](https://github.com/Blobscan/blobscan/commit/f62f1a2757d4209e7459ce18c4b7ea132258dbe5), [`cafdf6f`](https://github.com/Blobscan/blobscan/commit/cafdf6f5421f50ae0b88ea2563933f14e3db9d76)]:
  - @blobscan/blob-storage-manager@0.0.7
  - @blobscan/logger@0.0.6
  - @blobscan/blob-propagator@0.0.7
  - @blobscan/db@0.3.1
  - @blobscan/open-telemetry@0.0.6

## 0.5.0

### Minor Changes

- [#325](https://github.com/Blobscan/blobscan/pull/325) [`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167) Thanks [@mirshko](https://github.com/mirshko)! - Added support for mode and zora rollups

### Patch Changes

- Updated dependencies [[`a86de7e`](https://github.com/Blobscan/blobscan/commit/a86de7e6a242a7fda0b59a4f214a74a6fdf20167)]:
  - @blobscan/db@0.3.0
  - @blobscan/blob-propagator@0.0.6
  - @blobscan/blob-storage-manager@0.0.6

## 0.4.2

### Patch Changes

- Updated dependencies [[`04bfb3c`](https://github.com/Blobscan/blobscan/commit/04bfb3cc78ce76f5e08cca1063f33bd6714b7096)]:
  - @blobscan/logger@0.0.5
  - @blobscan/blob-propagator@0.0.5
  - @blobscan/blob-storage-manager@0.0.5
  - @blobscan/db@0.2.1
  - @blobscan/open-telemetry@0.0.5

## 0.4.1

### Patch Changes

- [#308](https://github.com/Blobscan/blobscan/pull/308) [`62ad85c`](https://github.com/Blobscan/blobscan/commit/62ad85c74214e807d9d58a310801dee96befd93c) Thanks [@0xGabi](https://github.com/0xGabi)! - Added support for zkSync rollup

## 0.4.0

### Minor Changes

- [#277](https://github.com/Blobscan/blobscan/pull/277) [`39fb917`](https://github.com/Blobscan/blobscan/commit/39fb917444f2751ddbd1f571fdcd6f66919c078d) Thanks [@0xGabi](https://github.com/0xGabi)! - Included filter per rollup for blobs and transactions

### Patch Changes

- Updated dependencies [[`3c09b5b`](https://github.com/Blobscan/blobscan/commit/3c09b5bf8ea854f30a6675b022a87b1a04960bf6), [`1ea0023`](https://github.com/Blobscan/blobscan/commit/1ea0023cdfdba270d0cadb307f8799baa75af414)]:
  - @blobscan/zod@0.0.4
  - @blobscan/db@0.2.0
  - @blobscan/blob-propagator@0.0.4
  - @blobscan/blob-storage-manager@0.0.4
  - @blobscan/open-telemetry@0.0.4

## 0.3.0

### Minor Changes

- [#284](https://github.com/Blobscan/blobscan/pull/284) [`14c0ed0`](https://github.com/Blobscan/blobscan/commit/14c0ed06ad543239138fc5c14f753a1cf2175032) Thanks [@0xGabi](https://github.com/0xGabi)! - Enhanced the `getByBlobId` procedure to include related transactions and blocks in the blob response

### Patch Changes

- [#291](https://github.com/Blobscan/blobscan/pull/291) [`1f40a4b`](https://github.com/Blobscan/blobscan/commit/1f40a4b7dbe73a947c3325588069bbbd50b334da) Thanks [@PJColombo](https://github.com/PJColombo)! - Removed the slot number from block IDs to eliminate ambiguities

- [#296](https://github.com/Blobscan/blobscan/pull/296) [`56ebc7d`](https://github.com/Blobscan/blobscan/commit/56ebc7d0fa44ef5abdea4df4ab31fe697bcfde21) Thanks [@0xGabi](https://github.com/0xGabi)! - Fixed blob gas as calldata calculation

- [#295](https://github.com/Blobscan/blobscan/pull/295) [`b307c59`](https://github.com/Blobscan/blobscan/commit/b307c59cace1858634b0bf54099338429c69ce63) Thanks [@0xGabi](https://github.com/0xGabi)! - Split getByBlockId schema to handle openapi parse restrictions

- [#294](https://github.com/Blobscan/blobscan/pull/294) [`3a9c304`](https://github.com/Blobscan/blobscan/commit/3a9c3045b35dd3efef29caa75b87cbf5549f7ee2) Thanks [@0xGabi](https://github.com/0xGabi)! - Resolved overall stats format

- Updated dependencies [[`9d018bd`](https://github.com/Blobscan/blobscan/commit/9d018bd56895ad6e904bda8ec81c850c02230b11)]:
  - @blobscan/db@0.1.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`411023b`](https://github.com/Blobscan/blobscan/commit/411023b92abe25f21e06e4084faca43cde0f41c3), [`a39efaf`](https://github.com/Blobscan/blobscan/commit/a39efafec2732d0ceced9f97fc0d538cf7b0c922), [`0c937dc`](https://github.com/Blobscan/blobscan/commit/0c937dc29f1fec3e9390179f0ae37559ba5ce6c3), [`824ccc0`](https://github.com/Blobscan/blobscan/commit/824ccc01ef8c533dcf5ed8d9cd1b5f9ce30ed145)]:
  - @blobscan/db@0.1.1
  - @blobscan/zod@0.0.3
  - @blobscan/blob-propagator@0.0.3
  - @blobscan/blob-storage-manager@0.0.3
  - @blobscan/open-telemetry@0.0.3

## 0.2.0

### Minor Changes

- [#272](https://github.com/Blobscan/blobscan/pull/272) [`e4bced8`](https://github.com/Blobscan/blobscan/commit/e4bced8334239c71f59f04c0a487e2a71bca7369) Thanks [@PJColombo](https://github.com/PJColombo)! - Revamped the reorged slots handling endpoint.

  The endpoint now accepts a set of forked slots and marks those that exist in the database as reorganized. This is achieved by transferring the transactions of the corresponding blocks to the fork transactions table.

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

- [#252](https://github.com/Blobscan/blobscan/pull/252) [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a) Thanks [@PJColombo](https://github.com/PJColombo)! - Eliminated the need for the Beacon API endpoint in stats calculation by tracking the last finalized block in the database and utilizing it internally.

### Patch Changes

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset

- Updated dependencies [[`71887f8`](https://github.com/Blobscan/blobscan/commit/71887f8dc09b45b0cb0748c0d6e8ddce2662f34d), [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73), [`acf8dff`](https://github.com/Blobscan/blobscan/commit/acf8dff07d62a33d5dfa3789fd1f4e2aa3e968a3), [`263d86f`](https://github.com/Blobscan/blobscan/commit/263d86ff5e35f7cf9d5bf18f6b745f8dd6249e62), [`cb732e7`](https://github.com/Blobscan/blobscan/commit/cb732e7febcbc05bdec2221fec1213bcb8172717), [`534545c`](https://github.com/Blobscan/blobscan/commit/534545c321e716d24f2d73d89660271610189a8a), [`5ed5186`](https://github.com/Blobscan/blobscan/commit/5ed51867d5b01b0572bfa69f3211a5b5bfaf254e)]:
  - @blobscan/db@0.1.0
  - @blobscan/blob-storage-manager@0.0.2
  - @blobscan/blob-propagator@0.0.2
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/dayjs@0.0.2
  - @blobscan/zod@0.0.2
