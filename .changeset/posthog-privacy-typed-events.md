---
"@blobscan/web": patch
"@blobscan/api": patch
"@blobscan/env": patch
---

Limited PostHog to page views and the app's own events (no autocapture, session recording, heatmaps, surveys or cookie), typed the analytics events, added tests for the previous/next navigation hook, and removed the unused `posthog-node` dependency and the server-side `POSTHOG_ID`/`POSTHOG_HOST` env vars
