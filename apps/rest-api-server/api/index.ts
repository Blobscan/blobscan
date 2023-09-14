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
import { logger } from "@blobscan/logger";
import { collectDefaultMetrics, promRegister } from "@blobscan/open-telemetry";

import { printBanner } from "./banner";
import { env } from "./env";
import { morganMiddleware } from "./middlewares/morgan";
import { openApiDocument } from "./openapi";

printBanner();

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

// Serve Swagger UI with our OpenAPI schema
app.use("/", swaggerUi.serve);
app.get("/", swaggerUi.setup(openApiDocument));

app.listen(env.BLOBSCAN_API_PORT, () => {
  logger.info(
    `REST API server started on http://0.0.0.0:${env.BLOBSCAN_API_PORT}`
  );
});
