---
"@blobscan/web": patch
---

Declared `/blob/<versioned hash>` as the canonical URL of the blob page (rendered on the server, as an absolute URL), blocked blob URLs with a query in `robots.txt`, and marked the links that carry a blob position (`?tx=&index=`) as `nofollow`. A blob posted in many transactions had one crawlable URL per transaction, and each one loaded every transaction of the blob.
