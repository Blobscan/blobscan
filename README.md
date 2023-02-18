# Blobscan <a href="#"><img align="right" src=".github/assets/blobi.jpeg" height="80px" /></a>

Blobscan is the first blockchain explorer that helps to navigate and visualize those [EIP-4844](https://www.eip4844.com) blobs, providing the necessary infrastructure to scale Ethereum.

The architecture of our system has the following parts:

- Modified consensus and execution layer clients
- A blockchain indexer that saves the data in a MongoDB database
- A frontend that allows navigating the data, having specific pages for blocks, transactions, addresses, and blobs.

## How to run it?

Two environment variables are necessary to connect to the MongoDB database with the blockchain data. Write the following lines in a new `.env` file:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@<host>/?retryWrites=true&w=majority
MONGODB_DB=<db-name>
```

Then run the following command:

```
pnpm install
pnpm dev
```

The MongoDB can be filled running the script in the [blobscan-indexer](https://github.com/Blobscan/blobscan-indexer) repository. If you prefer to use docker we have created an image for the indexer at [blossomlabs/blobscan-indexer](https://hub.docker.com/repository/docker/blossomlabs/blobscan-indexer/general).
