---
title: Welcome to Blobscan
---

Blobscan is a blockchain explorer for [EIP-4844](https://www.eip4844.com) blobs.
This standard provides a new type of transaction that will help scaling Ethereum.

The architecture of Blobscan has the following components:

- An [indexer](/docs/indexer) that communicates with consensus and execution layer clients, fetches blob information and stores it in our different storage solutions.
- A frontend that allows navigating the data, having specific pages for blocks, transactions, addresses, and blobs.
- An API that the indexer can talk to and contains shared logic with the frontend.
- A blob storage manager with support for different storage providers to keep blob data available.
- A Redis-based [BullMQ](https://bullmq.io/) queue for processing jobs in the background, such as:
    - Updating data of the charts
    - Uploading blobs in parallel to multiple storage services
- CLI tools for managing background jobs

{% quick-links %}

{% quick-link title="Installation" icon="installation" href="/docs/installation" description="Step-by-step guides to configuring and running Blobscan." /%}

{% quick-link title="Running locally" icon="plugins" href="/docs/running-blobscan-locally" description="Set up your local environment and run Blobscan." /%}

{% quick-link title="Codebase" icon="presets" href="/docs/codebase-overview" description="Learn how the internals work and contribute." /%}

{% quick-link title="Troubleshooting" icon="theming" href="/docs/troubleshooting" description="Find how to solve common issues." /%}

{% /quick-links %}

---

## Submit an issue

{% callout title="Found a bug?" %}
[Feel free to open an issue in our issue tracker at GitHub.](https://github.com/Blobscan/blobscan/issues)
{% /callout %}

## Join the community

You can reach us on [Discord!](https://discordapp.com/invite/fmqrqhkjHY/)
