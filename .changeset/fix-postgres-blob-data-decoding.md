---
"@blobscan/web": patch
---

Fixed Postgres-backed blob data being returned as UTF-8 encoded hexadecimal characters instead of the original binary bytes.
