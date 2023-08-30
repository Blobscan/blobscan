---
title: Running locally
nextjs:
  metadata:
    title: Running locally
    description: How to run your own instance of Blobscan
---


## Requirements

* Node.js 18+
* [pnpm](https://pnpm.io/)

## Installing dependencies

Install a recent Node.js version and pnpm:

```shell
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Then install all the Node.js dependencies:

```shell
pnpm install
pnpm dev
```

Lastly, create the database schema:

```shell
pnpm db:push
```
