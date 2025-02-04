import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "../../../env.mjs";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;

  switch (method) {
    case "GET": {
      const clientEnv = Object.fromEntries(
        Object.entries(env).filter(([key]) => key.startsWith("PUBLIC"))
      );

      return res.status(200).json(clientEnv);
    }

    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}
