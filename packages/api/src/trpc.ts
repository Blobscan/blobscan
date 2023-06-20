import { t } from "./clients/trpc";
import { isJWTAuthed } from "./middlewares/isJWTAuthed";
import {
  PAGINATION_SCHEMA,
  withPagination,
} from "./middlewares/withPagination";

// import { getServerSession, type Session } from "@blobscan/auth";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API
 *
 * These allow you to access things like the database, the session, etc, when
 * processing a request
 *
 */
// type CreateContextOptions = {
//   session: Session | null;
// };

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here
 *
 * Examples of things you may need it for:
 * - testing, so we dont have to mock Next.js' req/res
 * - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
// const createInnerTRPCContext = (opts: CreateContextOptions) => {
//   return {
//     session: opts.session,
//     prisma,
//   };
// };

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
// export const createTRPCContext = async (opts: CreateNextContextOptions) => {
//   const { req, res } = opts;

//   // Get the session from the server using the unstable_getServerSession wrapper function
//   const session = await getServerSession({ req, res });

//   return createInnerTRPCContext({
//     session,
//   });
// };

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure
 */
// const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
//   if (!ctx.session?.user) {
//     throw new TRPCError({ code: "UNAUTHORIZED" });
//   }
//   return next({
//     ctx: {
//       // infers the `session` as non-nullable
//       session: { ...ctx.session, user: ctx.session.user },
//     },
//   });
// });

export const createTRPCRouter = t.router;

export const paginatedProcedure = t.procedure
  .input(PAGINATION_SCHEMA)
  .use(withPagination);
export const publicProcedure = t.procedure;
export const jwtAuthedProcedure = t.procedure.use(isJWTAuthed);
