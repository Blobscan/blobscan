---
title: API
nextjs:
  metadata:
    title: API
    description: Blobscan API
---

Blobscan provides `api.blobscan.com`, a REST API that you can use to retrieve blobs, blocks and transactions metrics and use them in your own dashboards.

This API provides also some endpoints that are used internally by the [Indexer](indexer). For security, these endpoints
are protected with a shared secret that is used for digitally signing JSON Web Tokens (JWT).
This is what the `SECRET_KEY` environment variable is for.

{% callout title="Swagger UI" %}
[Explorer the API documentation.](https://api.blobscan.com/)
{% /callout %}
