import type { RequestHandler } from "express";

import { createMetricsHandler } from "@blobscan/api";
import { env } from "@blobscan/env";

import { prisma } from "../clients/prisma";

const apiMetricsHandler = createMetricsHandler(prisma);

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const metricsHandler: RequestHandler = function (req, res) {
  if (!env.METRICS_ENABLED) {
    res.statusCode = 403;
    res.end("Metrics are disabled");

    return;
  }

  return apiMetricsHandler(req, res);
};
