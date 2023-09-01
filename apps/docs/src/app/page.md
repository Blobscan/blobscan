---
title: Welcome to Blobscan
---

Blobscan is a blockchain explorer for those [EIP-4844](https://www.eip4844.com) blobs, providing the necessary infrastructure to scale Ethereum.

The architecture of Blobscan has the following components:

- An [indexer](https://github.com/Blobscan/blobscan-indexer.rs) that communicates with consensus and execution layer clients, fetches blob information and stores it in a PostgreSQL database
- A frontend that allows navigating the data, having specific pages for blocks, transactions, addresses, and blobs.
- An API that the indexer can talk to and contains shared logic with the frontend.

{% quick-links %}

{% quick-link title="Installation" icon="installation" href="/docs/installation" description="Step-by-step guides to configuring and running Blobscan." /%}

{% quick-link title="Running locally" icon="plugins" href="/docs/running-locally" description="Set up your local environment and run Blobscan." /%}

{% quick-link title="Architecture guide" icon="presets" href="/docs/architecture-guide" description="Learn how the internals work and contribute." /%}

{% quick-link title="Troubleshooting" icon="theming" href="/docs/troubleshooting" description="Find how to solve common issues." /%}

{% /quick-links %}

---

## Submit an issue

{% callout title="Found a bug?" %}
[Feel free to open an issue in our issue tracker at GitHub.](https://github.com/Blobscan/blobscan/issues)
{% /callout %}

## Join the community

You can reach us on [Discord!](https://discordapp.com/invite/fmqrqhkjHY/)
