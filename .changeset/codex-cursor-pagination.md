---
"@blobscan/api": minor
"@blobscan/web": minor
"@blobscan/docs": patch
---

Added cursor pagination at `/v1/blocks`, `/v1/blobs`, and `/v1/transactions`. Kept the existing unversioned list routes and tRPC `getAll` procedures compatible. Updated the web lists, including address page transactions, to use the new `getAllByCursor` procedures. Added First, Previous, and Next controls with cursor state in the URL, current and total page numbers, and item count badges that stay visible during page navigation. Replaced counts in parentheses with the shared count badge in detail page headings, search result headings, and Starknet table headings. Reduced count badge sizes relative to their headers and matched the loading skeleton to each badge size. Restricted web page sizes to 10, 25, 50, and 100, with 50 as the default for invalid route values.

The new v1 routes use the returned `pagination.nextCursor` or `pagination.previousCursor` token through `cursor`. Their page size must be an integer from 1 to 100. The existing routes still accept `p` and keep their previous page-size rules.
