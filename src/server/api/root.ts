import { createTRPCRouter } from "~/server/api/trpc";
import { blockRouter } from "~/server/api/routers/block";
import { transactionRouter } from "~/server/api/routers/transaction";
import { blobRouter } from "~/server/api/routers/blob";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  block: blockRouter,
  tx: transactionRouter,
  blob: blobRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
