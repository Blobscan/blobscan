# @blobscan/stats-syncer

## 0.1.0

### Minor Changes

- 4f26fe3: Enhanced overall stats calculation for scalability by enabling batch processing.

### Patch Changes

- a42cd8c: Removed exported stats syncer instance
- 0d0304e: Set up changeset
- c90dc34: Improved daily stats aggregation to include calculations for every day from the last recorded date up to yesterday.
- cfd7937: Fixed an issue where redis connection remained open after closing the stats syncer.
- 534545c: Eliminated the need for the Beacon API endpoint in stats calculation by tracking the last finalized block in the database and utilizing it internally.
- Updated dependencies [71887f8]
- Updated dependencies [2bce443]
- Updated dependencies [2fb02b0]
- Updated dependencies [263d86f]
- Updated dependencies [cb732e7]
- Updated dependencies [534545c]
- Updated dependencies [5ed5186]
  - @blobscan/db@0.1.0
  - @blobscan/logger@0.0.2
  - @blobscan/dayjs@0.0.2
