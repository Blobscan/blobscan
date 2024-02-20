---
"@blobscan/stats-aggregation-cli": minor
"@blobscan/api": minor
"@blobscan/db": minor
"@blobscan/web": minor
---

- Add Support For Block Reorganizations:

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
