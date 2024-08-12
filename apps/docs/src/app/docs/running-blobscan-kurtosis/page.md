---
title: Spin up Blobscan using Kurtosis
nextjs:
  metadata:
    title: Spin up Blobscan using Kurtosis
    description: Run Blobscan using Kurtosis
---

[Kurtosis](https://www.kurtosis.com/) is a tool for packaging and launching environments of containerized services where you want them and with one liners.

There is also a [Kurtosis' ethereum-package](https://github.com/ethpandaops/ethereum-package) maintained by ethPandaOps, which makes it really easy to
spin up up a local PoS Ethereum testnet with blobscan as an additional service, so you can explore blobs sent in your local network.

```bash
kurtosis clean -a && kurtosis run github.com/ethpandaops/ethereum-package --image-download always '{"additional_services": ["blobscan"]}'
```

{% figure src="/blobscan-kurtosis.png" /%}

The screenshot above displays all the services that are running now and their port redirects:

- **Web**: http://127.0.0.1:32811
- **API**: http://127.0.0.1:32810
- **Database**: 127.0.0.1:32855

## Development

For debugging or development it can be useful to clone the ethereum-package
and run Kurtosis from it. The Blobscan service is defined in [blobscan_launcher.star](https://github.com/ethpandaops/ethereum-package/blob/main/src/blobscan/blobscan_launcher.star).

```bash
git clone https://github.com/ethpandaops/ethereum-package.git

cd ethereum-package
kurtosis clean -a && kurtosis run . --image-download always '{"additional_services": ["blobscan", "goomy_blob"]}'
```

This time we also included **goomy_blob**, a blob spammer.

{% callout title="More about Kurtosis" %}
* [Installation guide](https://docs.kurtosis.com/install/)
* [Kurtosis: A Deep Dive to Local Devnets](https://ethpandaops.io/posts/kurtosis-deep-dive/) by ethPandaOps
{% /callout %}
