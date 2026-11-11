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
[Explore the API documentation.](https://api.blobscan.com/)
{% /callout %}

## Cursor pagination

The `/blocks`, `/transactions`, and `/blobs` endpoints use cursor pagination. To get the first page, omit `cursor`:

```http
GET /transactions?ps=50
```

The response includes the resource list and a `pagination` object:

```json
{
  "transactions": [],
  "pagination": {
    "nextCursor": null,
    "previousCursor": null
  }
}
```

When a next or previous page exists, its cursor is a string. Pass that string unchanged as the `cursor` parameter to get that page. Both directions use the same parameter. A `null` cursor means that no page exists in that direction. To return to the first page, omit `cursor` again.

Keep the resource, filters, and sort order the same when you use a cursor. If you change them, start with the first page. The server rejects invalid cursors and cursors for different query settings. The cursor format is internal to the server; clients must not decode or construct tokens.

The `ps` parameter sets the page size. Its default is 50. It must be an integer from 1 to 100. The `p` parameter is no longer supported; requests that include it return an error.

Total counts are optional. Use `count=true` to include the resource total. Pagination does not require a total count.

Each request uses the current database state. A cursor records a position, so it can still work if the record at that position was removed. Results can change after a chain reorganization. Pagination does not preserve a fixed snapshot between requests.
