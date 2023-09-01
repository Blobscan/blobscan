import type {
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import type { TRPCContext } from "../src/context";
import { createTRPCContext } from "../src/context";
import { createTRPCInnerContext } from "../src/context";
import { appRouter } from "../src/root";

export async function getCaller({
  withClient = false,
}: { withClient?: boolean } = {}) {
  if (withClient) {
    const token = jwt.sign("foobar", "supersecret");
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as NodeHTTPRequest;

    const ctx = (await createTRPCContext({
      req,
      res: {} as NodeHTTPResponse,
    })) as TRPCContext;

    return appRouter.createCaller(ctx);
  }

  const ctx = (await createTRPCInnerContext()) as TRPCContext;
  return appRouter.createCaller(ctx);
}

export const INDEXER_DATA = {
  block: {
    number: 1003,
    hash: "blockHash003",
    timestamp: 1630257174,
    slot: 103,
    blobGasUsed: "10000",
    excessBlobGas: "5000",
  },
  transactions: [
    {
      hash: "txHash008",
      from: "address9",
      to: "address3",
      blockNumber: 1003,
      gasPrice: "20000",
      maxFeePerBlobGas: "15000",
    },
    {
      hash: "txHash009",
      from: "address4",
      to: "address8",
      blockNumber: 1003,
      gasPrice: "10000",
      maxFeePerBlobGas: "1800",
    },
    {
      hash: "txHash010",
      from: "address7",
      to: "address2",
      blockNumber: 1003,
      gasPrice: "3000000",
      maxFeePerBlobGas: "20000",
    },
  ],
  blobs: [
    {
      versionedHash: "blobHash008",
      commitment: "commitment008",
      data: "0x34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      txHash: "txHash008",
      index: 0,
    },
    {
      versionedHash: "blobHash009",
      commitment: "commitment009",
      data: "0x34567890abcdef1234567890abcdef",
      txHash: "txHash009",
      index: 0,
    },
    {
      versionedHash: "blobHash010",
      commitment: "commitment010",
      data: "0x34567890abcdef1234567890abcdef1234567890abcdef",
      txHash: "txHash010",
      index: 0,
    },
  ],
};
