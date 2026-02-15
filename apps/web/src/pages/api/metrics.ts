import type { NextApiRequest, NextApiResponse } from "next";

import { createMetricsHandler } from "@blobscan/api";

import { env } from "~/env";
import { prisma } from "~/prisma";

const metricsHandler = createMetricsHandler(prisma);

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (!env.METRICS_ENABLED) {
    res.statusCode = 403;
    res.end("Metrics are disabled");

    return;
  }

  return metricsHandler(req, res);
};
