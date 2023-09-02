---
title: Architecture
nextjs:
  metadata:
    title: Architecture
    description: Overview of the Blobscan's architecture
---

Blobscan is composed of different components that talk to each other over HTTP through REST endpoints and RPCs.

## Diagram

{% figure  src="/architecture.svg" appendCurrentTheme=true /%}

## Overview

Blobscan is comprised of the following major components:

- **Web App**: A [Next.js](https://nextjs.org/) application hosted on [Vercel](https://vercel.com/) that spins up a [tRPC API](https://trpc.io) that communicates with the database via [Prisma](https://www.prisma.io/). It also uses [Tailwind CSS](https://tailwindcss.com/) for styling.
- **REST API**: An express app that runs the tRPC API with OpenAPI support. It exposes some of the tRPC API endpoints as REST endpoints for the public and external services such as the indexer.
- **Indexer**: A Rust service that listens to the Ethereum blockchain looking for blocks and transactions containing blobs and forwards them to the REST API to be indexed.
