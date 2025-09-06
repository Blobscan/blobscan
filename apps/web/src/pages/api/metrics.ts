import type { NextApiRequest, NextApiResponse } from "next";

import { metricsHandler } from "@blobscan/api";

import { env } from "~/env.mjs";

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (!env.METRICS_ENABLED) {
    res.statusCode = 403;
    res.end("Metrics are disabled");

    return;
  }

  return metricsHandler(req, res);
};
