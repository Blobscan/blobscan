---
"@blobscan/web": patch
"@blobscan/api": patch
---

Returned `null` from `block.getAdjacentBlock` when there is no block in that direction instead of a `NOT_FOUND` error. The block page now disables that arrow, shows a message when the adjacent block cannot be loaded, and the `nav_arrow_click` event records missing blocks as `none` and cancelled page changes as `cancelled`
