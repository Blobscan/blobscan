Blobscan
========

Blobscan is the first blockchain explorer that helps to navigate and visualize those EIP-4844 blobs, providing the necessary infrastructure to scale Ethereum.

The architecture of our system has the following parts:
- Modified consensus and execution layer clients
- A blockchain indexer that saves the data in a MongoDB database
- A frontend that allows navigating the data, having specific pages for blocks, transactions, addresses, and blobs.

We are running an execution and a consensus client (geth and prysm respectively) that syncs with the EIP-4844 devchain. In addition, and more precisely, we use a specific branch of the prysm repository that contains a new HTTP API to retrieve the EIP-4844 sidecars (the detachable data that can be pruned after one month).

We coded a daemon that retrieves the data from the execution layer (EL) and the consensus layer (CL), matching the transactions (stored in EL) with their correspondent blobs (stored in CL) and indexes them in a MongoDB database. However, we only index finalized blocks, so we extended the ethers.js provider to be able to read them.

We also provide a simple blockchain explorer frontend available at https://blobscan.com that reads the database's information and allows navigating it.

With blobscan we can navigate and visualize the blob data. For example, the search box can find block numbers and hashes, transaction hashes, addresses, blob-versioned hashes, and blob KZG commitments.

## How to run it?

Two environment variables are necessary to connect to the MongoDB database with the blockchain data. Write the following lines in a new `.env` file:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@<host>/?retryWrites=true&w=majority
MONGODB_DB=<db-name>
```

Then run the following command:

```
npm run dev
```

The MongoDB can be filled running the script in the [blob-indexer](https://github.com/BlossomLabs/blob-indexer) repository.