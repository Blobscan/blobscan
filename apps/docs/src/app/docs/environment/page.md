---
title: Environment variables
nextjs:
  metadata:
    title: Environment variables
    description: How to configure your Blobscan instance
---

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

| Variable                         | Description                               | Required | Default value                                                                                                             |
| -------------------------------- | ----------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `BEACON_NODE_ENDPOINT`           | Beacon node endpoint                      | Yes      | (empty)                                                                                                                   |
| `EXECUTION_NODE_ENDPOINT`        | Execution node endpoint                   | Yes      | (empty)                                                                                                                   |
| `CHAIN_ID`                       | EVM chain id                              | Yes      | `1`                                                                                                                       |
| `NETWORK_NAME`                   | Network's name                            | Yes      | `ethereum`                                                                                                                |
| `NEXT_PUBLIC_SUPPORTED_NETWORKS` | Link to other pages from the Network menu | No       | `[{"label":"Holesky","href":"https://holesky.blobscan.com/"},{"label":"Sepolia","href":"https://sepolia.blobscan.com/"}]` |
| `NEXT_PUBLIC_BEACON_BASE_URL`    | Beacon explorer URL                       | Yes      | `https://beaconcha.in/`                                                                                                   |
| `NEXT_PUBLIC_EXPLORER_BASE_URL`  | Block explorer URL                        | Yes      | `https://etherscan.io`                                                                                                    |

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

| Variable                | Description          | Required | Default value |
| ----------------------- | -------------------- | -------- | ------------- |
| `SWARM_STORAGE_ENABLED` | Store blobs in Swarm | No       | `false`       |
| `BEE_ENDPOINT`          | Bee endpoint         | No       | (empty)       |
| `BEE_DEBUG_ENDPOINT`    | Bee debug endpoint   | No       | (empty)       |

## Blob propagator

| Variable                  | Description             | Required | Default value              |
| ------------------------- | ----------------------- | -------- | -------------------------- |
| `BLOB_PROPAGATOR_ENABLED` | Enable blob propagation | No       | `false`                    |
| `REDIS_URI`               | Redis host              | No       | `redis://localhost:6379/1` |

## Indexer

| Variable                | Description           | Required | Default value       |
| ----------------------- | --------------------- | -------- | ------------------- |
| `BLOBSCAN_API_ENDPOINT` | Blobscan API endpoint | Yes      | (empty)             |
| `RUST_LOG`              | Configure logger      | No       | `blob-indexer=INFO` |
| `SENTRY_DSN_INDEXER`    | Sentry SDN            | No       | (empty)             |

## Telemetry

| Variable                      | Description                                                                     | Required | Default value |
| ----------------------------- | ------------------------------------------------------------------------------- | -------- | ------------- |
| `METRICS_ENABLED`             | Expose the /metrics endpoint                                                    | No       | `false`       |
| `TRACES_ENABLED`              | Enable instrumentation of functions and sending traces to a collector           | No       | `false`       |
| `OTLP_AUTH_USERNAME`          | Username for basic authentication. E.g. Grafana Cloud ID                        | No       | (empty)       |
| `OTLP_AUTH_PASSWORD`          | Password for basic authentication. E.g. Grafana Cloud Token                     | No       | (empty)       |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP transport protocol to be used for all telemetry data.                      | No       | (empty)       |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Base endpoint URL for any signal type, with an optionally-specified port number | No       | (empty)       |
