import { z } from "zod";

import { publicProcedure } from "./procedures";
// import { authRouter } from "./router/auth";
import { blobRouter } from "./router/blob";
import { blockRouter } from "./router/block";
import { indexerRouter } from "./router/indexer";
import { searchRouter } from "./router/search";
import { statsRouter } from "./router/stats";
import { syncStateRouter } from "./router/sync-state";
import { transactionRouter } from "./router/tx";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  healthcheck: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/healthcheck",
        summary: "Connection healthcheck",
        tags: ["system"],
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
  stats: statsRouter,
  syncState: syncStateRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
