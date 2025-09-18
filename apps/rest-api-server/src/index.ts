/* eslint-disable @typescript-eslint/no-misused-promises */
import * as Sentry from "@sentry/node";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-openapi";

import "./bigint";
import { createTRPCContext, createMetricsHandler } from "@blobscan/api";
import { env } from "@blobscan/env";
import { collectDefaultMetrics } from "@blobscan/open-telemetry";

import "./instrumentation";
import { logger } from "@blobscan/logger";

import { appRouter } from "./app-router";
import { printBanner } from "./banner";
import { getBlobPropagator } from "./blob-propagator";
import { openApiDocument } from "./openapi";
import { prisma } from "./prisma";
import { setUpSyncers } from "./syncers";

collectDefaultMetrics();

printBanner();

async function main() {
  const metricsHandler = createMetricsHandler(prisma);
  const closeSyncers = await setUpSyncers();

  const blobPropagator = await getBlobPropagator();

  logger.info("Blob propagator service set up!");

  const app = express();

  app.use(cors());
  app.use(bodyParser.json({ limit: "3mb" }));
  app.use(morgan("short"));

  app.get("/metrics", (req, res) => {
    if (!env.METRICS_ENABLED) {
      res.statusCode = 403;
      res.end("Metrics are disabled");

      return;
    }

    return metricsHandler(req, res);
  });

  // Serve Swagger UI with our OpenAPI schema
  app.use("/", swaggerUi.serve);
  app.get("/", swaggerUi.setup(openApiDocument));

  // Handle incoming OpenAPI requests
  app.use(
    "/",
    createOpenApiExpressMiddleware({
      router: appRouter,
      createContext: createTRPCContext({
        blobPropagator,
        chainId: env.CHAIN_ID,
        enableTracing: env.TRACES_ENABLED,
        prisma,
        scope: "rest-api",
        apiKeys: {
          admin: env.ADMIN_API_KEY,
          accesses: {
            blobDataRead: env.BLOB_DATA_API_KEY,
          },
          services: {
            indexer: env.SECRET_KEY,
            loadNetwork: env.WEAVEVM_API_KEY,
          },
        },
      }),
      onError({ error }) {
        Sentry.captureException(error);

        logger.error(error);
      },
    })
  );

  const server = app.listen(env.BLOBSCAN_API_PORT, () => {
    logger.info(`Server started on http://0.0.0.0:${env.BLOBSCAN_API_PORT}`);
  });

  async function gracefulShutdown(signal: string) {
    logger.debug(`Received ${signal}. Shutting down...`);

    await prisma
      .$disconnect()
      .finally(async () => {
        await blobPropagator?.close();
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
