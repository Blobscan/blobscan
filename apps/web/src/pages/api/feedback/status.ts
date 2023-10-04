import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "~/env.mjs";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ enabled: !!env.FEEDBACK_WEBHOOK_URL });
}
