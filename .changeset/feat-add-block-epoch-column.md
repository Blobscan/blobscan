---
"@blobscan/chains": minor
"@blobscan/db": minor
"@blobscan/api": minor
---

Add an `epoch` column to the block table

Track the consensus-layer epoch for each block. The indexer now derives
the epoch from the block slot (`floor(slot / slotsPerEpoch)`, via the new
`Chain.getEpochBySlot` helper) and stores it on the block row. The column
is nullable for now so existing rows can be backfilled in a follow-up
before it's made non-nullable.
