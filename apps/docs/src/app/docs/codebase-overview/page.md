---
title: Codebase Overview
nextjs:
  metadata:
    title: Codebase Overview
    description: A breakdown of the Blobscan's codebase
---

Below you can find a breakdown of the Blobscan's codebase.

## Architecture

Blobscan.com is comprised of the following major components:

- **Web App**: A [Next.js](https://nextjs.org/) application hosted on [Vercel](https://vercel.com/) that spins up a [tRPC API](https://trpc.io) that communicates with the database via [Prisma](https://www.prisma.io/). It also uses [Tailwind CSS](https://tailwindcss.com/) for styling.
- **REST API**: An express app that runs the tRPC API with OpenAPI support. It exposes some of the tRPC API endpoints as REST endpoints for the public and external services such as the indexer.
- **Indexer**: A Rust service that listens to the Ethereum blockchain looking for blocks and transactions containing blobs and forwards them to the REST API to be indexed.

{% figure  src="/architecture.svg" appendCurrentTheme=true /%}

## Repository structure

Blobscan is a monorepo managed with [Turborepo](https://turbo.build/) which contains two main folders: `apps` and `packages`.

The indexer is not part of the monorepo and it's located in a separate [repository](https://github.com/Blobscan/blobscan-indexer.rs/tree/master).

### Apps

Blobscan is composed of the following apps:

| App                                                                                                   | Description                                 |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
|  [`@blobscan/docs`](https://github.com/Blobscan/blobscan/tree/master/apps/docs)                       | Nextjs app that contains the documentation. |
|  [`@blobscan/web`](https://github.com/Blobscan/blobscan/tree/master/apps/web)                         | Nextjs app that contains the web app.       |
|  [`@blobscan/rest-api-server`](https://github.com/Blobscan/blobscan/tree/master/apps/rest-api-server) | Express app that contains the REST API.     |

### Packages

Here you can find all the shared packages used by the apps:

| Package                                                                                                            | Description                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@blobscan/api`](https://github.com/Blobscan/blobscan/tree/master/packages/api)                                   | tRPC rouders and procedures used by the web app and the REST API                                                                                                                                                             |
| [`@blobscan/blob-storage-manager`](https://github.com/Blobscan/blobscan/tree/master/packages/blob-storage-manager) | Orchestrates the storage/retrieval of blobs in/from different storage providers. Currently it supports [Google Cloud Storage](https://cloud.google.com/storage), [Swarm](https://www.ethswarm.org), and PostgreSQL database. |
| [`@blobscan/dayjs`](https://github.com/Blobscan/blobscan/tree/master/packages/dayjs)                               |  Extended [Day.js](https://day.js.org/) with plugins.                                                                                                                                                                        |
| [`@blobscan/eslint`](https://github.com/Blobscan/blobscan/tree/next/packages/config/eslint)                        | ESLint configuration shared across all packages.                                                                                                                                                                             |
| [`@blobscan/db`](https://github.com/Blobscan/blobscan/tree/master/packages/db)                                     | Prisma schema and a Prisma client with [extensions](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions) containing custom methods queries.                                                       |
|  [`@blobscan/open-telemetry`](https://github.com/Blobscan/blobscan/tree/master/packages/open-telemetry)            | [Otel](https://opentelemetry.io/) configuration and sdk setup.                                                                                                                                                               |
| [`@blobscan/test`](https://github.com/Blobscan/blobscan/tree/master/packages/test)                                 |  Shared test utilities and fixtures.                                                                                                                                                                                         |
|  [`@blobscan/zod`](https://github.com/Blobscan/blobscan/tree/master/packages/zod)                                  |  Shared [Zod](https://zod.dev) schemas and utilities.                                                                                                                                                                        |
