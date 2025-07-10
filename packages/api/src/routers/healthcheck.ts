import { z } from "@blobscan/zod";

import { publicProcedure } from "../procedures";

export const healthcheck = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/healthcheck",
      summary: "connection healthcheck.",
      tags: ["system"],
    },
  })
  .input(z.void())
  .output(z.string())
  .query(() => "yay!");
