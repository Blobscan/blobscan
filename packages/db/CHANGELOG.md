# @blobscan/db

## 0.1.0

### Minor Changes

- 71887f8: - Add Support For Block Reorganizations:

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

- 534545c: Eliminated the need for the Beacon API endpoint in stats calculation by tracking the last finalized block in the database and utilizing it internally.
- 5ed5186: Added kzg proof field to Blob table

### Patch Changes

- 2fb02b0: Set up changeset
- 263d86f: Improved date normalization error message
- cb732e7: Resolved Date normalization issue
- Updated dependencies [2bce443]
- Updated dependencies [2fb02b0]
  - @blobscan/logger@0.0.2
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/dayjs@0.0.2
