/* eslint-disable @typescript-eslint/no-misused-promises */

import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-openapi";

import {
  appRouter,
  createTRPCContext,
  metricsHandler,
  gracefulShutdown as apiGracefulShutdown,
} from "@blobscan/api";
import { logger } from "@blobscan/logger";
import { collectDefaultMetrics } from "@blobscan/open-telemetry";
import { StatsSyncer } from "@blobscan/stats-syncer";

import { env } from "./env";
import { openApiDocument } from "./openapi";
import { getNetworkDencunForkSlot } from "./utils";

collectDefaultMetrics();

const statsSyncer = new StatsSyncer({
  redisUri: env.REDIS_URI,
  lowestSlot:
    env.DENCUN_FORK_SLOT ?? getNetworkDencunForkSlot(env.NETWORK_NAME),
});

statsSyncer.run({
  cronPatterns: {
    daily: env.STATS_SYNCER_DAILY_CRON_PATTERN,
    overall: env.STATS_SYNCER_OVERALL_CRON_PATTERN,
  },
});

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morgan("tiny"));

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
      scope: "rest-api",
    }),
    onError({ error }) {
      logger.error(error);
    },
  })
);

const server = app.listen(env.BLOBSCAN_API_PORT, () => {
  logger.info(
    `REST API server started on http://0.0.0.0:${env.BLOBSCAN_API_PORT}`
  );
});

async function gracefulShutdown(signal: string) {
  logger.debug(`Received ${signal}. Shutting down...`);

  await apiGracefulShutdown()
    .finally(() => statsSyncer.close())
    .finally(() => {
      server.close(() => {
        logger.debug("REST API server shut down successfully");
      });
    });
}

// Listen for TERM signal .e.g. kill
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));

// Listen for INT signal e.g. Ctrl-C
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
