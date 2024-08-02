---
title: Installation
nextjs:
  metadata:
    title: Installation
    description: How to run your own instance of Blobscan
---

Blobscan is open source and you can run your own instance either locally or publically exposed on the Internet.

---

## Requirements

In order to run Blobscan you need a virtual machine with these minimum specs:

- 2 vCPU
- 4 GB RAM
- 100 GB Hard disk

Additionally you need to connect to an Ethereum node.

Check out [eip4844-devnet](https://github.com/jimmygchen/eip4844-devnet) if you want to run your own devnet node.

## Configuration

Blobscan is configured using environment variables. You can define them using `export` or with an `.env` file.

We provide a `.env.example` file as reference which you can use as starting point.

```shell
cp .env.example .env
```

Then go through the file and edit the [environment variables](/docs/environment).

In order to run Blobscan you are required to define the following ones:

- SECRET_KEY
- BEACON_NODE_ENDPOINT
- EXECUTION_NODE_ENDPOINT
- DATABASE_URL

## Running Blobscan

### Docker (recommended)

{% callout type="warning" title="Docker version" %}
A recent version of docker with BuildKit support is required.
{% /callout %}

Docker makes it very straightforward to run Blobscan. Docker images are automatically [published](https://hub.docker.com/u/blossomlabs) and a docker-compose file is provided for convenience.

Spinning up the containers:

```shell
docker compose up -d
```

Docker will download the images and run them in containers. After initialization, your Blobscan frontend will be available at `http://localhost:3001`.

### Kubernetes (advanced)

{% callout title="You should know!" %}
This is an advanced setup and requires knowledge of [Kubernetes](https://kubernetes.io/docs/tutorials/kubernetes-basics/) and [Helm](https://helm.sh/docs/).
{% /callout %}

We also provide Helm charts to ease deploying Blobscan into a Kubernetes cluster.

```shell
helm repo add blobscan-helm-charts https://blobscan.github.io/blobscan-helm-charts
helm install blobscan blobscan-helm-charts/blobscan
```

Check out the [blobscan-helm-charts](https://github.com/Blobscan/blobscan-helm-charts) repository for more information.

### Local environment

Check out [Running locally](/docs/running-locally).

### Background jobs

Check out [Background jobs](/docs/background-jobs).
