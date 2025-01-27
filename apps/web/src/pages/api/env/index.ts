import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "@blobscan/env";

import { clientEnvVarsSchema } from "../../../env.mjs";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;

  switch (method) {
    case "GET": {
      const parsedEnv = clientEnvVarsSchema.safeParse(env);

      if (!parsedEnv.success) {
        return res.status(400).json({
          error: "Error parsing client side environment variables",
          details: parsedEnv.error.format(),
        });
      }

      const clientEnv = Object.fromEntries(
        Object.entries(parsedEnv.data)
          .filter(([key]) => key.startsWith("NEXT_"))
          .map(([key, value]) => [key.replace(/^NEXT_/, ""), value])
      );

      return res.status(200).json(clientEnv);
    }

    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}
