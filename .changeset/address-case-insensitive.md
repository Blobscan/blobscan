---
"@blobscan/db": patch
"@blobscan/api": patch
---

Fixed the search and the address filters, which did not find addresses with upper-case letters (for example, checksummed addresses). The API now changes addresses to lower case before it reads the database.
