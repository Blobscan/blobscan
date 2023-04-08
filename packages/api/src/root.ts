import { authRouter } from "./router/auth";
import { blobRouter } from "./router/blob";
import { blockRouter } from "./router/block";
import { transactionRouter } from "./router/transaction";
import { createTRPCRouter, publicProcedure } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  healthcheck: publicProcedure.query(() => "yay!"),

  auth: authRouter,
  block: blockRouter,
  tx: transactionRouter,
  blob: blobRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
