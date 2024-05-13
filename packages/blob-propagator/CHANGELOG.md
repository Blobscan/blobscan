# @blobscan/blob-propagator

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

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`95fbf74`](https://github.com/Blobscan/blobscan/commit/95fbf7471f5e5cacec7513f0736a70a18f971ce1) Thanks [@PJColombo](https://github.com/PJColombo)! - Allowed to remove storage jobs from finalizer queue depedencies if they fail

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`d7a760d`](https://github.com/Blobscan/blobscan/commit/d7a760da302ce01f1f6f1072d98a10cc100dc1f5) Thanks [@PJColombo](https://github.com/PJColombo)! - Added support for retrieving blob data by hash in addition to by its references.

- [#380](https://github.com/Blobscan/blobscan/pull/380) [`7e2d4d0`](https://github.com/Blobscan/blobscan/commit/7e2d4d0f601127c00ade2f01e4936579463230fd) Thanks [@PJColombo](https://github.com/PJColombo)! - Filtered out duplicated blobs when propagating multiple blobs

- [#388](https://github.com/Blobscan/blobscan/pull/388) [`40824c2`](https://github.com/Blobscan/blobscan/commit/40824c26f6d8a360592c812bd1afe505d9fc4f6d) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Decoupled blob storage creation from enviroment variables

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
