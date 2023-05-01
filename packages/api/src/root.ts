import { z } from "zod";

// import { authRouter } from "./router/auth";
import { blobRouter } from "./router/blob";
import { blockRouter } from "./router/block";
import { indexerRouter } from "./router/indexer";
import { searchRouter } from "./router/search";
import { transactionRouter } from "./router/tx";
import { createTRPCRouter, publicProcedure } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  healthcheck: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/healthcheck",
        summary: "Connection healthcheck",
      },
    })
    .input(z.void())
    .output(z.string())
    .query(() => "yay!"),

  // auth: authRouter,
  block: blockRouter,
  tx: transactionRouter,
  blob: blobRouter,
  search: searchRouter,
  indexer: indexerRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
