import { z } from "@blobscan/zod";

import { publicProcedure } from "../procedures";

// Kept so existing probes (every deployed environment used it) keep working while they move to
// /healthz and /readyz; remove it once none of them calls it.
export const healthcheck = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/healthcheck",
      summary: "connection healthcheck (deprecated: use /healthz or /readyz).",
      deprecated: true,
      tags: ["system"],
    },
  })
  .input(z.void())
  .output(z.string())
  .query(() => "yay!");
