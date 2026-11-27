---
"@blobscan/web": minor
"@blobscan/docs": patch
---

Added `/api/relay`, which forwards the PostHog requests of the browser to `PUBLIC_POSTHOG_HOST` so that ad blockers do not drop them. It is on by default and can be turned off with `PUBLIC_POSTHOG_PROXY_ENABLED=false`
