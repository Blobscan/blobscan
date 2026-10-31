---
"@blobscan/db": patch
"@blobscan/rest-api-server": patch
---

Fall back to `DATABASE_URL` when `DIRECT_URL` is unset, honor `schema`, `connection_limit` and `pool_timeout` URL params with the Prisma 7 pg adapter (defaulting to 17 connections and a 10s pool timeout), restore the `prisma_pool_connections_open` and `prisma_client_queries_wait` pool gauges, count raw queries in the label-free `prisma_client_queries_total` and `prisma_client_queries_duration_histogram_ms` series (now recorded in milliseconds), and make `/readyz` crash-safe with a shared in-flight check
