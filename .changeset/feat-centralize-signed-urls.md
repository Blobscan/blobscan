---
"@blobscan/api": minor
"@blobscan/web": patch
---

Centralized blob signed URL resolution into a `withBlobSignedUrls` tRPC middleware. Transaction and block endpoints now return signed URLs for blob data storage references (previously only the blob endpoints did), falling back to the plain stored URL when signing is unavailable. Added the `GOOGLE_STORAGE_SIGNED_URLS_ENABLED` env var to the web app.
