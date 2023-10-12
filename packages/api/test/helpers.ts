import type {
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import blobStorageManager from "@blobscan/blob-storage-manager/src/__mocks__/BlobStorageManager";

import type { TRPCContext } from "../src/context";
import { createTRPCContext } from "../src/context";
import { createTRPCInnerContext } from "../src/context";

export async function getContext({
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

  return mockBlobStorageManager
    ? { ...ctx, blobStorageManager: blobStorageManager }
    : ctx;
}
