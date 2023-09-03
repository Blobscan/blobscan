import type {
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import blobStorageManager from "@blobscan/blob-storage-manager/src/__mocks__/BlobStorageManager";
import { prisma } from "@blobscan/db";

import type { TRPCContext } from "../src/context";
import { createTRPCContext } from "../src/context";
import { createTRPCInnerContext } from "../src/context";
import { appRouter } from "../src/root";

export async function getCaller({
  withClient = false,
  mockBlobStorageManager = false,
}: { withClient?: boolean; mockBlobStorageManager?: boolean } = {}) {
  let ctx;
  if (withClient) {
    const token = jwt.sign("foobar", "supersecret");
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as NodeHTTPRequest;

    ctx = (await createTRPCContext({
      req,
      res: {} as NodeHTTPResponse,
    })) as TRPCContext;
  } else {
    ctx = (await createTRPCInnerContext()) as TRPCContext;
  }

  ctx = mockBlobStorageManager
    ? { ...ctx, blobStorageManager: blobStorageManager }
    : ctx;

  return appRouter.createCaller(ctx);
}

export async function getIndexedData(caller) {
  const [block, addresses, txs, blobs, storageRefs, blobsOnTransactions] =
    await Promise.all([
      caller.block.getByBlockNumber({
        number: 1003,
      }),
      prisma.address.findMany({
        select: {
          address: true,
        },
        orderBy: {
          address: "asc",
        },
      }),
      prisma.transaction.findMany({
        select: {
          hash: true,
          blockNumber: true,
        },
        orderBy: {
          hash: "asc",
        },
      }),
      prisma.blob.findMany({
        select: {
          versionedHash: true,
          commitment: true,
          size: true,
          firstBlockNumber: true,
        },
        orderBy: {
          versionedHash: "asc",
        },
      }),
      prisma.blobDataStorageReference.findMany({
        select: {
          blobHash: true,
          blobStorage: true,
          dataReference: true,
        },
        orderBy: {
          blobHash: "asc",
        },
      }),
      prisma.blobsOnTransactions.findMany({
        select: {
          blobHash: true,
          txHash: true,
          index: true,
        },
        orderBy: {
          blobHash: "asc",
        },
      }),
    ]);

  return {
    block,
    addresses,
    txs,
    blobs,
    storageRefs: storageRefs.sort((a, b) => {
      // First, compare by blobHash
      if (a.blobHash < b.blobHash) return -1;
      if (a.blobHash > b.blobHash) return 1;

      // If blobHash is the same, compare by blobStorage
      if (a.blobStorage < b.blobStorage) return -1;
      if (a.blobStorage > b.blobStorage) return 1;

      return 0; // If everything is the same
    }),
    blobsOnTransactions,
  };
}

export function filterData(data) {
  if (Array.isArray(data)) {
    return data.map((d) => {
      delete d.updatedAt;
      delete d.insertedAt;
    });
  }

  delete data.updatedAt;
  delete data.insertedAt;
  return data;
}
