import { loggingRouter } from "../../src/routers/logging";
import { t } from "../../src/trpc-client";

export const createLoggingCaller = t.createCallerFactory(loggingRouter);

export type LoggingCaller = ReturnType<typeof createLoggingCaller>;
