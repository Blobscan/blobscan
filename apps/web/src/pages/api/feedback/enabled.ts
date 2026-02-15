import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "~/env";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    enabled: Boolean(env.FEEDBACK_WEBHOOK_URL),
  });
}
