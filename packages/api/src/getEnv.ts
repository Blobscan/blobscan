import { env } from "@blobscan/env";

import { publicProcedure } from "./procedures";

export const getEnv = publicProcedure.query(() => {
  const clientEnv = Object.entries(env)
    .filter(([key]) => key.startsWith("NEXT_"))
    .map(([key, value]) => [key.replace(/^NEXT_/, ""), value]);

  return Object.fromEntries(clientEnv);
});
