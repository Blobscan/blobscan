---
title: Kurtosis
nextjs:
  metadata:
    title: Kurtosis
    description: Run Blobscan using Kurtosis
---

[Kurtosis](https://www.kurtosis.com/) is a tool for packaging and launching environments of containerized services where you want them and with one liners.

There is also a [kurtosis' ethereum-package](https://github.com/ethpandaops/ethereum-package) maintained by ethpandaops.

The following command will spin up a local PoS Ethereum testnet and blobscan as an additional service, so you can explore blobs sent in your local network.

```
kurtosis clean -a && kurtosis run github.com/ethpandaops/ethereum-package --image-download always '{"additional_services": ["blobscan"]}'
```
