import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-openapi";

import {
  appRouter,
  createTRPCContext,
  getPrismaMetricsClient,
} from "@blobscan/api";
import { collectDefaultMetrics, promRegister } from "@blobscan/open-telemetry";

import { env } from "./env";
import { logger } from "./logger";
import { morganMiddleware } from "./middlewares/morgan";
import { openApiDocument } from "./openapi";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morganMiddleware);

if (env.METRICS_ENABLED) {
  collectDefaultMetrics();
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.get("/metrics", async (_req, res) => {
    const prismaMetricsClient = getPrismaMetricsClient();
    try {
      const [appMetrics, prismaMetrics] = await Promise.all([
        promRegister.metrics(),
        prismaMetricsClient?.prometheus() ?? Promise.resolve(""),
      ]);

      res.set("Content-Type", promRegister.contentType);

      res.end(appMetrics + prismaMetrics);
    } catch (err) {
      res.status(500).end(err);
    }
  });
}

// Handle incoming OpenAPI requests
app.use(
  "/api",
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  createOpenApiExpressMiddleware({
    router: appRouter,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    createContext: createTRPCContext,
    onError({ error }) {
      logger.error(error);
    },
  })
);

function printBanner() {
  console.log(" ____  _       _");
  console.log("| __ )| | ___ | |__  ___  ___ __ _ _ __");
  console.log("|  _ \\| |/ _ \\| '_ \\/ __|/ __/ _` | '_ \\");
  console.log("| |_) | | (_) | |_) \\__ \\ (_| (_| | | | |");
  console.log("|____/|_|\\___/|_.__/|___/\\___\\__,_|_| |_|");
  console.log("Blobscan API (EIP-4844 blob explorer) - blobscan.com");
  console.log("====================================================\n");

  logger.info(`Telemetry: metrics=${env.METRICS_ENABLED}, traces=${env.TRACES_ENABLED}`);

  if (env.TRACES_ENABLED) {
    logger.info(`OpenTelemetry configuration: protocol=${env.OTEL_EXPORTER_OTLP_PROTOCOL}, endpoint=${env.OTEL_EXPORTER_OTLP_ENDPOINT}`);
  }

  if (env.SENTRY_DSN_API) {
    console.log("Sentry DSN:", env.SENTRY_DSN_API);
  }
}

printBanner();

// Serve Swagger UI with our OpenAPI schema
app.use("/", swaggerUi.serve);
app.get("/", swaggerUi.setup(openApiDocument));

app.listen(env.BLOBSCAN_API_PORT, () => {
  logger.info(
    `REST API server started on http://0.0.0.0:${env.BLOBSCAN_API_PORT}`
  );
});
