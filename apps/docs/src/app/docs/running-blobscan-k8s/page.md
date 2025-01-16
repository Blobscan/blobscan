---
title: Deploy in Kubernetes
nextjs:
  metadata:
    title: Deploy in Kubernetes
    description: Run Blobscan using our Helm Charts
---

A set of Helm charts are provided to run multiple Blobscan components on Kubernetes.

{% callout title="Tip" %}
If you want to try the Helm Charts without setting up a whole Kubernetes cluster, you can create a local [Kind](https://kind.sigs.k8s.io/) cluster.
{% /callout %}

```bash
kind create cluster
kubectl cluster-info --context kind-kind
```

## Installing helm chart

First you will need to add a new repository:

```bash
helm repo add blobscan-helm-charts https://blobscan.github.io/blobscan-helm-charts
```

Then retrieve the packages in the repository and install:

```bash
helm repo update
helm install blobscan blobscan-helm-charts/blobscan
```

The easiest way is installing `blobscan`, which is an umbrella chart which will install `blobscan-api`, `blobscan-web` and `blobscan-indexer`.

## List of helm charts available

```bash
helm search repo blobscan-helm-charts
```

| Name                                  | Description         |
| ------------------------------------- | ------------------- |
| blobscan-helm-charts/blobscan         | Blobscan meta-chart |
| blobscan-helm-charts/blobscan-api     | Blobscan API        |
| blobscan-helm-charts/blobscan-indexer | Blobscan indexer    |
| blobscan-helm-charts/blobscan-web     | Blobscan Web UI     |

## Uninstalling blobscan

Remove blobscan:

```bash
helm ls
helm uninstall blobscan
```

{% callout title="Tip" %}
If you used a local Kind cluster.
{% /callout %}

```bash
kind delete cluster
```
