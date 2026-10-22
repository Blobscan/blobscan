---
"@blobscan/web": patch
"@blobscan/docs": patch
"@blobscan/rest-api-server": patch
"@blobscan/auth": patch
"@blobscan/blob-storage-manager": patch
"@blobscan/db": patch
"@blobscan/open-telemetry": patch
"@blobscan/optimism-decoder": patch
"@blobscan/syncers": patch
---

Update dependencies to remediate security advisories.

- Upgrade Sentry, OpenTelemetry, Vitest, Next.js, bee-js and storage clients
- Upgrade `@vercel/ncc` so the REST API bundle supports the new OpenTelemetry packages
- Adapt the docs Markdoc loader to Next.js 16.3's SWC bundle layers
- Remove the unused `@upstash/feedback` dependency
