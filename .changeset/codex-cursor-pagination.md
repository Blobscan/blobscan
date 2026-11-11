---
"@blobscan/api": minor
"@blobscan/web": minor
"@blobscan/docs": patch
---

Replaced page-number pagination with cursor pagination for block, blob, and transaction lists, including address page transactions. Added First, Previous, and Next controls with cursor state in the URL, current and total page numbers, and item count badges. Restricted web page sizes to 10, 25, 50, and 100, with 50 as the default for invalid route values.

**Breaking change:** Removed the `p` request parameter. Clients must use the returned `pagination.nextCursor` or `pagination.previousCursor` token through `cursor`. Page size must be an integer from 1 to 100.
