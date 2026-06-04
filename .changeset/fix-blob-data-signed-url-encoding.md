---
"@blobscan/web": patch
---

Fixed blob data retrieval failing for signed storage URLs. The blob data proxy now URL-encodes the reference URL and derives the file type from the URL pathname, so signed GCS URLs (which carry `X-Goog-*` query parameters) are no longer truncated.
