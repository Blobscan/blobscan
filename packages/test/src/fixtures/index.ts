import type { BlobStorage } from "@prisma/client";

import data from "./data.json";

type BlobDataStorageReferenceFixture = {
  blobHash: string;
  blobStorage: BlobStorage;
  dataReference: string;
};

export const fixtures = {
  blocks: data.blocks,
  addresses: data.addresses,
  txs: data.txs,
  blobs: data.blobs,
  blobDataStorageRefs:
    data.blobDataStorageReferences as BlobDataStorageReferenceFixture[],
  blobsOnTransactions: data.blobsOnTransactions,
};
