---
title: Testing
nextjs:
  metadata:
    title: Testing
    description: Testing setup for Blobscan.
---

At Blobscan, we believe in ensuring that our code not only functions correctly but is also maintainable and robust.

We rely on testing to ensure our solutions meet user expectations.

## Philosophy

**Focus on Behavior and Requirements:** Our tests are designed to validate what the system should do, not necessarily how it does it. By doing so, we ensure that:

- We maintain clarity about the requirements and expected outcomes.
- The code remains flexible, allowing developers to refactor and optimize without constant test breakages.

**Avoid Testing Internals:** We generally steer clear of testing private or internal functions directly. This aligns with our behavior-driven approach. However, complex internal logic may sometimes warrant its own set of tests.

## Testing Tools

**Framework:** We utilize [Vitest](https://vitest.dev), which is set up with a [workspace configuration](https://vitest.dev/guide/workspace.html) tailored for our monorepo.

**Integration Testing:** Our integration tests run with a local PostgreSQL database and a [fake GCS server](https://github.com/fsouza/fake-gcs-server), orchestrated via [Docker](https://www.docker.com). This ensures our tests mimic real-world scenarios. We employ a [specific script](https://github.com/Blobscan/blobscan/blob/next/scripts/run-integration.sh) to set up these services before initiating tests.

## Setting Up Your Environment

To get started with testing, follow these steps:

1. Clone the Repository:

```bash
git clone https://github.com/Blobscan/blobscan.git
cd blobscan
```

2. Install Dependencies:

```bash
pnpm install
```

3. Configure Environment Variables:

Make a copy of the `.env.test` and rename it to `.env`:

```bash
cp .env.test .env
```

Then, adjust the `.env` file as [outlined here](/docs/environment).

4. Initialize Docker Containers:

```bash
pnpm test:setup
```

5. Execute Tests:

```bash
pnpm test
```

{% callout title="Tip" %}
You can streamline steps 4 and 5 using `pnpm test:dev`.
{% /callout %}

## Test Fixtures Configuration

Our test fixtures provide mock data for both PostgreSQL and Google Cloud Storage. All fixtures are housed in the `@blobscan/test` package.

### Structure of the Package

- **fixtures**: This directory contains separate subfolders with the mock data for each service.

- **helpers**: Within this folder, you'll find utility functions that help to load and reset the fixtures using [prisma](https://www.prisma.io), ensuring a clean slate.

### Integration with fake GCS server

The mock data present in the `storage` subfolder of `fixtures`, is pre-configured on the [fake-gcs-server](https://github.com/fsouza/fake-gcs-server).
This ensures that every time we initiate tests involving storage, the emulator starts with our designated mock data.
