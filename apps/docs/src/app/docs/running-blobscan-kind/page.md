# Deploy in Kind

## Setting up cluster

```
kind create cluster
kubectl cluster-info --context kind-kind
```

## Installing blobscan

```
helm repo add blobscan-helm-charts https://blobscan.github.io/blobscan-helm-charts
helm search repo blobscan-helm-charts

helm repo update
helm install blobscan blobscan-helm-charts/blobscan
```

## Uninstalling blobscan

Remove blobscan:

```
helm ls
helm uninstall blobscan
```

Delete cluster:

```
kind delete cluster
```
