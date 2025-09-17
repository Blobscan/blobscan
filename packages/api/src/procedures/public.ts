import { withTelemetry } from "../middlewares/withTelemetry";
import { t } from "../trpc-client";

export const publicProcedure = t.procedure.use(withTelemetry);
