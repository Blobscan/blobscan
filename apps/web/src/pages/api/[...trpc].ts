import { type NextApiRequest, type NextApiResponse } from "next";
import cors from "nextjs-cors";
import { createOpenApiNextHandler } from "trpc-openapi";

import { appRouter, createTRPCContext } from "@blobscan/api";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Setup CORS
  await cors(req, res);

  // Handle incoming OpenAPI requests
  return createOpenApiNextHandler({
    router: appRouter,
    createContext: createTRPCContext,
  })(req, res);
};

export default handler;
