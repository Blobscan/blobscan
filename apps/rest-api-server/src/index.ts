/* eslint-disable @typescript-eslint/no-misused-promises */
import * as Sentry from "@sentry/node";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-openapi";

import "./bigint";
import { appRouter, createTRPCContext, metricsHandler } from "@blobscan/api";
import { env } from "@blobscan/env";
import { collectDefaultMetrics } from "@blobscan/open-telemetry";

import "./instrumentation";
import { prisma } from "@blobscan/db";

import { printBanner } from "./banner";
import { getBlobPropagator } from "./blob-propagator";
import { logger } from "./logger";
import { morganMiddleware } from "./morgan";
import { openApiDocument } from "./openapi";
import { setUpSyncers } from "./syncers";

collectDefaultMetrics();

printBanner();

async function main() {
  const closeSyncers = await setUpSyncers();

  const blobPropagator = await getBlobPropagator();

  const app = express();

  app.use(cors());
  app.use(bodyParser.json({ limit: "3mb" }));
  app.use(morganMiddleware);

  app.get("/metrics", metricsHandler);

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
        scope: "rest-api",
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
        await blobPropagator.close();
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

main();
