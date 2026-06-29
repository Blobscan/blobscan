---
"@blobscan/chains": minor
"@blobscan/db": minor
"@blobscan/api": minor
"@blobscan/rest-api-server": minor
"@blobscan/web": minor
---

Add an `epoch` field to blocks

Track the consensus-layer epoch for each block. The indexer derives the
epoch from the block slot (`floor(slot / slotsPerEpoch)`, via the new
`Chain.getEpochBySlot` helper) and stores it on the block row, the block
API responses now return it, and the block details page displays it. The
column is nullable for now so existing rows can be backfilled in a
follow-up before it's made non-nullable; until then the web falls back to
deriving the epoch from the slot.
