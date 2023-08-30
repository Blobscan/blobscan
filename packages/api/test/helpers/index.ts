import type { NodeHTTPRequest } from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import type { TRPCContext } from "../../src/context";
import { createTRPCInnerContext, getJWTFromRequest } from "../../src/context";
import { appRouter } from "../../src/root";

export async function getCaller({
  withClient = false,
}: { withClient?: boolean } = {}) {
  if (withClient) {
    const token = jwt.sign("foobar", "supersecret");
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as NodeHTTPRequest;
    const apiClient = getJWTFromRequest(req);

    const ctx = (await createTRPCInnerContext({
      apiClient: apiClient,
    })) as TRPCContext;

    return appRouter.createCaller(ctx);
  }

  const ctx = (await createTRPCInnerContext()) as TRPCContext;
  return appRouter.createCaller(ctx);
}
