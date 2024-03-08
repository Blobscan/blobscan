# @blobscan/api

## 0.1.0

### Minor Changes

- 02f5bb8: Added support for new blob field (kzg proof)
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

- cc1b68c: Added the following API changes:

  - Allowed to retrieve blocks by id (hash, slot, number)
  - Allowed to retrieve blobs by id (hash, commitment)
  - Added new procedure to retrieve full entities for blocks and transactions
  - Added support for OpenAPI retrieval procedures for blobs, transactions, and blocks
  - Allowed to configure OpenAPI document baseUrl

- 534545c: Eliminated the need for the Beacon API endpoint in stats calculation by tracking the last finalized block in the database and utilizing it internally.

### Patch Changes

- 2fb02b0: Set up changeset
- Updated dependencies [71887f8]
- Updated dependencies [2fb02b0]
- Updated dependencies [263d86f]
- Updated dependencies [cb732e7]
- Updated dependencies [534545c]
- Updated dependencies [5ed5186]
  - @blobscan/db@0.1.0
  - @blobscan/blob-storage-manager@0.0.2
  - @blobscan/blob-propagator@0.0.2
  - @blobscan/open-telemetry@0.0.2
  - @blobscan/dayjs@0.0.2
  - @blobscan/zod@0.0.2
