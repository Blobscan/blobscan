import type { BlobStorage } from "@prisma/client";

import data from "./data.json";

type BlobDataStorageReferenceFixture = {
  blobHash: string;
  blobStorage: BlobStorage;
  dataReference: string;
};

type BlobDataFixture = {
  id: string;
  data: Buffer;
};

export const fixtures = {
  blockchainSyncState: data.blockchainSyncState,
  blocks: data.blocks,
  addresses: data.addresses,
  txs: data.txs,
  blobs: data.blobs,
  blobDataStorageRefs:
    data.blobDataStorageReferences as BlobDataStorageReferenceFixture[],
  blobDatas: data.blobDatas as unknown as BlobDataFixture[],
  blobsOnTransactions: data.blobsOnTransactions,
};
