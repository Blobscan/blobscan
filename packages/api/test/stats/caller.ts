import { statsRouter } from "../../src/routers/stats";
import { t } from "../../src/trpc-client";

export const createStatsCaller = t.createCallerFactory(statsRouter);

export type StatsCaller = ReturnType<typeof createStatsCaller>;
