---
title: How to contribute
nextjs:
  metadata:
    title: How to contribute
    description: How to contribute to Blobscan.
---

Thank you for your interest in contributing to Blobscan! We welcome contributions from everyone, and this document provides some guidelines to make the contribution process smoother.

## Code of Conduct

All contributors are expected to follow our [Code of Conduct](/docs/code-of-conduct). Please make sure you are welcoming and friendly in all our spaces.

## Getting Started

- Ensure you have a [GitHub account](https://github.com/).
- Look for an issue to tackle in our [issue tracker on GitHub](https://github.com/Blobscan/blobscan/issues).
- Once you've chosen an issue, comment on it to let others know you're working on it.

## Making Changes

- Begin by [setting up Blobscan locally](/docs/running-blobscan-locally).
- Proceed to make your changes.
- Ensure you've tested your changes comprehensively. Refer to our [Testing Guide](/docs/testing) for details on our testing setup.
- Once done, push your changes to your GitHub fork.
- Create a pull request against our main repository.

## Contact

If you have questions or need help with your contribution, join our [Discord](https://discordapp.com/invite/fmqrqhkjHY/) server and ask in the `#🔎-blobscan` channel.

# Examples

## Add support for a new network

Steps:

1. Update Network type in package network-blob-config
2. Update networkSchema in web app

Check out the following PRs:

* https://github.com/Blobscan/blobscan/pull/823
* https://github.com/Blobscan/blobscan/commit/0a2a94c587e9b93f6b36ad15fd55065e824b5049

## Add a new storage provider

Steps:

1. Add new environment variables, if required
2. Update documentation
3. Add svg icon (StorageBadge component)
4. Add a new BlobPropagationWorkerProcessor
5. Add tests for the new storage provider

Check out the following PRs

* https://github.com/Blobscan/blobscan/pull/820

## Label a new rollup

TBW

