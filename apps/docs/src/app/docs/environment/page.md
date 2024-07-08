---
title: Environment variables
nextjs:
  metadata:
    title: Environment variables
    description: How to configure your Blobscan instance
---

# By Component

## Blobscan web

- `DATABASE_URL`
- `FEEDBACK_WEBHOOK_URL`
- `NEXT_PUBLIC_NETWORK_NAME`
- `NEXT_PUBLIC_EXPLORER_BASE_URL`
- `NEXT_PUBLIC_BEACON_BASE_URL`
- `NEXT_PUBLIC_VERSION`
- `NEXT_PUBLIC_SUPPORTED_NETWORKS`
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED`
- `NEXT_PUBLIC_GOOGLE_STORAGE_BUCKET_NAME`

Optional:

- `NEXT_PUBLIC_SENTRY_DSN_WEB`
- `NODE_ENV`
- `SENTRY_PROJECT`
- `SENTRY_ORG`

## Blobscan API

- `CHAIN_ID`
- `DATABASE_URL`
- `NETWORK_NAME`
- `REDIS_URI`
- `SECRET_KEY`

Optional (general):

- `BLOBSCAN_API_BASE_URL`
- `BLOBSCAN_API_PORT`
- `DENCUN_FORK_SLOT`
- `METRICS_ENABLED`
- `NODE_ENV`
- `SENTRY_DSN_API`
- `TRACES_ENABLED`

Optional (blob storages):

- `GOOGLE_SERVICE_KEY`
- `GOOGLE_STORAGE_ENABLED`
- `GOOGLE_STORAGE_API_ENDPOINT`
- `GOOGLE_STORAGE_BUCKET_NAME`
- `POSTGRES_STORAGE_ENABLED`
- `SWARM_STORAGE_ENABLED`
- `SWARM_BATCH_ID`
- `BEE_ENDPOINT`

Optional (cron patterns):

- `STATS_SYNCER_DAILY_CRON_PATTERN`
- `STATS_SYNCER_OVERALL_CRON_PATTERN`
- `SWARM_STAMP_CRON_PATTERN`

## Blobscan indexer

- `BEACON_NODE_ENDPOINT`
- `BLOBSCAN_API_ENDPOINT`
- `EXECUTION_NODE_ENDPOINT`
- `NETWORK_NAME`
- `SECRET_KEY`

Optional:

- `DENCUN_FORK_SLOT`
- `SENTRY_DSN`

# By Category

Below you can find a list of supported variables.
These are listed by category:

- [General](#general)
- [Network](#network)
- [Blob storages](#blob-storages)
- [Blob propagator](#blob-propagator)
- [Indexer](#indexer)
- [Telemetry](#telemetry)

## General

| Variable               | Description                           | Required | Default value |
| ---------------------- | ------------------------------------- | -------- | ------------- |
| `DATABASE_URL`         | Postgresql database URI               | Yes      | (empty)       |
| `SECRET_KEY`           | Shared key used for JWT               | Yes      | (empty)       |
| `BLOBSCAN_API_PORT`    | Blobscan API will listen on this port | No       | `3001`        |
| `FEEDBACK_WEBHOOK_URL` | Feedback webhook URL                  | No       | (empty)       |

## Network

| Variable                         | Description                               | Required | Default value                                                                                                                                                                |
| -------------------------------- | ----------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BEACON_NODE_ENDPOINT`           | Beacon node endpoint                      | Yes      | (empty)                                                                                                                                                                      |
| `EXECUTION_NODE_ENDPOINT`        | Execution node endpoint                   | Yes      | (empty)                                                                                                                                                                      |
| `CHAIN_ID`                       | EVM chain id                              | Yes      | `1`                                                                                                                                                                          |
| `NETWORK_NAME`                   | Network's name                            | Yes      | `ethereum`                                                                                                                                                                   |
| `NEXT_PUBLIC_SUPPORTED_NETWORKS` | Link to other pages from the Network menu | No       | `[{"label":"Mainnet","href":"https://blobscan.com/"},{"label":"Holesky","href":"https://holesky.blobscan.com/"},{"label":"Sepolia","href":"https://sepolia.blobscan.com/"}]` |
| `NEXT_PUBLIC_BEACON_BASE_URL`    | Beacon explorer URL                       | Yes      | `https://beaconcha.in/`                                                                                                                                                      |
| `NEXT_PUBLIC_EXPLORER_BASE_URL`  | Block explorer URL                        | Yes      | `https://etherscan.io`                                                                                                                                                       |

## Blob storages

Blobscan can be configured to use any of the following blob storages:

- Postgres
- Google Cloud Storage
- Ethereum Swarm

At the moment Postgres is the default storage and Blobscan won't be able to run if you disable it. Other storages are optional.

**Postgres**

| Variable                   | Description                                        | Required | Default value |
| -------------------------- | -------------------------------------------------- | -------- | ------------- |
| `POSTGRES_STORAGE_ENABLED` | Store blobs in postgres database (default storage) | No       | `true`        |

**Google Cloud Storage**

| Variable                      | Description                                 | Required | Default value |
| ----------------------------- | ------------------------------------------- | -------- | ------------- |
| `GOOGLE_STORAGE_ENABLED`      | Store blobs in GCS                          | No       | `false`       |
| `GOOGLE_STORAGE_BUCKET_NAME`  | GCS bucket name                             | No       | (empty)       |
| `GOOGLE_STORAGE_PROJECT_ID`   | GCS project ID                              | No       | (empty)       |
| `GOOGLE_SERVICE_KEY`          | Google Cloud service key                    | No       | (empty)       |
| `GOOGLE_STORAGE_API_ENDPOINT` | Google Cloud API endpoint (for development) | No       | (empty)       |

**Ethereum Swarm**

| Variable                   | Description                | Required                        | Default value  |
| -------------------------- | -------------------------- | ------------------------------- | -------------- |
| `SWARM_STORAGE_ENABLED`    | Store blobs in Swarm       | No                              | `false`        |
| `SWARM_BATCH_ID`           | Swarm address of the stamp | If `SWARM_STORAGE_ENABLED=true` | (empty)        |
| `SWARM_STAMP_CRON_PATTERN` | Cron pattern for swarm job | No                              | `*/15 * * * *` |
| `BEE_ENDPOINT`             | Bee endpoint               | No                              | (empty)        |

## Blob propagator

| Variable                  | Description             | Required | Default value              |
| ------------------------- | ----------------------- | -------- | -------------------------- |
| `BLOB_PROPAGATOR_ENABLED` | Enable blob propagation | No       | `false`                    |
| `REDIS_URI`               | Redis host              | Yes      | `redis://localhost:6379/1` |

## Indexer

| Variable                | Description                                           | Required | Default value       |
| ----------------------- | ----------------------------------------------------- | -------- | ------------------- |
| `BLOBSCAN_API_ENDPOINT` | Blobscan API endpoint                                 | Yes      | (empty)             |
| `RUST_LOG`              | Configure logger                                      | No       | `blob-indexer=INFO` |
| `SENTRY_DSN_INDEXER`    | Sentry SDN                                            | No       | (empty)             |
| `NETWORK_NAME`          | Automatically retrieve slot when blobs were activated | No       | `mainnet`           |
| `DENCUN_FORK_SLOT`      | Custom slot when blobs are activated                  | No       | (empty)             |

## Telemetry

| Variable                      | Description                                                                     | Required | Default value |
| ----------------------------- | ------------------------------------------------------------------------------- | -------- | ------------- |
| `METRICS_ENABLED`             | Expose the /metrics endpoint                                                    | No       | `false`       |
| `TRACES_ENABLED`              | Enable instrumentation of functions and sending traces to a collector           | No       | `false`       |
| `OTLP_AUTH_USERNAME`          | Username for basic authentication. E.g. Grafana Cloud ID                        | No       | (empty)       |
| `OTLP_AUTH_PASSWORD`          | Password for basic authentication. E.g. Grafana Cloud Token                     | No       | (empty)       |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP transport protocol to be used for all telemetry data.                      | No       | (empty)       |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Base endpoint URL for any signal type, with an optionally-specified port number | No       | (empty)       |
