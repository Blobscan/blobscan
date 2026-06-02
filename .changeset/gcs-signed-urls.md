---
"@blobscan/blob-storage-manager": minor
"@blobscan/api": minor
"@blobscan/env": minor
"@blobscan/rest-api-server": minor
"@blobscan/docs": patch
---

Add support for Google Cloud Storage signed URLs in blob API responses. When `GOOGLE_STORAGE_SIGNED_URLS` is set to `true`, the API returns time-limited signed URLs (1 hour) instead of public URLs for blobs stored in GCS, allowing private buckets to be used without exposing objects publicly. Defaults to `false`.

**Heads-up — production rollout:** Blobscan-hosted instances will enable this flag in production to reduce egress costs from public-bucket traffic. Self-hosted operators relying on stable public URLs (e.g. external caches, third-party integrations) should keep `GOOGLE_STORAGE_SIGNED_URLS=false` and be aware that signed URLs expire after 1 hour.

**Required permission:** the service account must have `roles/storage.objectViewer` (or equivalent signing permission) on the bucket. Without it, signing fails per request and the API logs an error and falls back to the original URL.
