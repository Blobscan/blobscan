# Deploy in Kind

## Setting up cluster

```bash
kind create cluster
kubectl cluster-info --context kind-kind
```

## Installing blobscan

```bash
helm repo add blobscan-helm-charts https://blobscan.github.io/blobscan-helm-charts
helm search repo blobscan-helm-charts

helm repo update
helm install blobscan blobscan-helm-charts/blobscan
```

## Uninstalling blobscan

Remove blobscan:

```bash
helm ls
helm uninstall blobscan
```

Delete cluster:

```bash
kind delete cluster
```
