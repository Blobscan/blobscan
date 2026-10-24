---
"@blobscan/api": patch
---

Return an explanatory 403 on `GET /blobs/{id}/data` when it is disabled, pointing to `GET /blobs/{id}` and the link in `dataStorageReferences` (or contact for bulk data), instead of a generic 404
