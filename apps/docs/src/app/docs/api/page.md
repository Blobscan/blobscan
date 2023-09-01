---
title: API
nextjs:
  metadata:
    title: API
    description: Blobscan API
---

Blobscan provides an API that you can use to retrieve metrics about blobs, blocks and transactions.

This API is used by the indexer as well, in order to store new data. However these endpoints
are password protected by a shared key (this is the `SECRET_KEY` environment variable).

---

{% callout title="Swagger UI" %}
[Explorer the API documentation.](https://api.blobscan.com/)
{% /callout %}
