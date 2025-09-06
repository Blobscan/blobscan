import type { NextApiRequest, NextApiResponse } from "next";

import { createMetricsHandler } from "@blobscan/api";
import { getPrisma } from "@blobscan/db";

import { env } from "~/env.mjs";

const metricsHandler = createMetricsHandler(getPrisma());

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (!env.METRICS_ENABLED) {
    res.statusCode = 403;
    res.end("Metrics are disabled");

    return;
  }

  return metricsHandler(req, res);
};
