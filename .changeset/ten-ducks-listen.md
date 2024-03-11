---
"@blobscan/db": patch
---

Resolved an issue where incrementally updating average-related statistics with a new value of zero—due to the absence of data in the new block range—incorrectly reduced the current average, instead of properly handling cases with no blocks.
