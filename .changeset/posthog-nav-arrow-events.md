---
"@blobscan/web": minor
---

Re-added PostHog analytics, loaded after the page with a dynamic import so that it stays out of the main bundle, and added a `nav_arrow_click` event for the previous/next arrows of the blob, block and transaction pages.
