---
title: Kurtosis
nextjs:
  metadata:
    title: Kurtosis
    description: Run Blobscan using Kurtosis
---

[Kurtosis](https://www.kurtosis.com/) is a tool for packaging and launching environments of containerized services where you want them and with one liners.

There is also a [kurtosis' ethereum-package](https://github.com/ethpandaops/ethereum-package) maintained by ethpandaops, which makes it really easy to
spin up up a local PoS Ethereum testnet with blobscan as an additional service, so you can explore blobs sent in your local network.

```
kurtosis clean -a && kurtosis run github.com/ethpandaops/ethereum-package --image-download always '{"additional_services": ["blobscan"]}'
```

{% figure src="/blobscan-kurtosis.png" appendCurrentTheme=true /%}

The screenshot above displays all the services that are running now and their port redirects:

* blobscan web: http://127.0.0.1:32811
* blobscan api: http://127.0.0.1:32810
* postgres: 127.0.0.1:32855

## Development

For debugging or development it can be useful to clone the ethereum-package
and run kurtosis from it
kurtosis clean -a && kurtosis run . --image-download always '{"additional_services": ["blobscan", "goomy_blob"]}'

{% callout title="Kurtosis" %}
[Installation guide](https://docs.kurtosis.com/install/)
{% /callout %}
