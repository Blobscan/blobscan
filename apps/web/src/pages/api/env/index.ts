import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "@blobscan/env";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;

  switch (method) {
    case "POST": {
      const clientEnv = Object.entries(env)
        .filter(([key]) => key.startsWith("NEXT_"))
        .map(([key, value]) => [key.replace(/^NEXT_/, ""), value]);

      return res.status(200).json({
        data: Object.fromEntries(clientEnv),
      });
    }

    default:
      throw new Error("Method not allowed");
  }
}
