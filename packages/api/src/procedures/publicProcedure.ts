import { t } from "../clients/trpc";
import { withTelemetry } from "../middlewares/withTelemetry";

export const publicProcedure = t.procedure.use(withTelemetry);
