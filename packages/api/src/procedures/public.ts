import { env } from "@blobscan/env";

import { withTelemetry } from "../middlewares/withTelemetry";
import { t } from "../trpc-client";

function buildPublicProcedure() {
  if (env.TRACES_ENABLED) {
    return t.procedure.use(withTelemetry);
  }

  return t.procedure;
}

export const publicProcedure = buildPublicProcedure();
