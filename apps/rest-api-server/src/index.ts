/* eslint-disable @typescript-eslint/no-misused-promises */
import * as Sentry from "@sentry/node";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";

import "./bigint";
import { createMetricsHandler } from "@blobscan/api";
import { env } from "@blobscan/env";
import { collectDefaultMetrics } from "@blobscan/open-telemetry";

import "./instrumentation";
import { logger } from "./logger";

import { printBanner } from "./banner";
import { prisma } from "./clients/prisma";
import { morganMiddleware } from "./morgan";
import { setUpOpenApiTRPC } from "./openapi-trpc";
import { getBlobPropagator } from "./services/blob-propagator";
import { setUpSyncers } from "./services/syncers";

collectDefaultMetrics();

printBanner();

async function main() {
  const metricsHandler = createMetricsHandler(prisma);
  const closeSyncers = await setUpSyncers();

  const app = express();

  app.use(cors());
  app.use(bodyParser.json({ limit: "3mb" }));
  app.use(morganMiddleware);

  app.get("/metrics", (req, res) => {
    if (!env.METRICS_ENABLED) {
      res.statusCode = 403;
      res.end("Metrics are disabled");

      return;
    }

    return metricsHandler(req, res);
  });

  await setUpOpenApiTRPC(app);

  const server = app.listen(env.BLOBSCAN_API_PORT, () => {
    logger.info(`Server started on http://0.0.0.0:${env.BLOBSCAN_API_PORT}`);
  });

  async function gracefulShutdown(signal: string) {
    logger.debug(`Received ${signal}. Shutting down...`);

    await prisma
      .$disconnect()
      .finally(async () => {
        (await getBlobPropagator()).close();
      })
      .finally(async () => {
        await closeSyncers();
      })
      .finally(() => {
        server.close(() => {
          logger.debug("Server shut down successfully");
        });
      });
  }

  // Listen for TERM signal .e.g. kill
  process.on("SIGTERM", async () => {
    await gracefulShutdown("SIGTERM");
  });

  // Listen for INT signal e.g. Ctrl-C
  process.on("SIGINT", async () => {
    await gracefulShutdown("SIGINT");
  });
}

main().catch((err) => {
  Sentry.captureException(err);

  logger.error(err);
});
