import * as Sentry from "@sentry/node";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import {
  createOpenApiExpressMiddleware,
  generateOpenApiDocument,
} from "trpc-openapi";

import { createAppRouter, createTRPCContext } from "@blobscan/api";
import { env } from "@blobscan/env";
import { logger } from "@blobscan/logger";

import { prisma } from "./clients/prisma";
import { redis } from "./clients/redis";
import { getBlobPropagator } from "./services/blob-propagator";

export async function setUpOpenApiTRPC(app: Express): Promise<void> {
  const appRouter = createAppRouter({
    blobRouter: {
      blobDataProcedure: {
        enabled: env.BLOB_DATA_API_ENABLED,
        protected: !!env.BLOB_DATA_API_KEY?.length,
      },
    },
  });
  // Generate OpenAPI schema document
  const openApiDocument = generateOpenApiDocument(appRouter, {
    title: "Blobscan API",
    description: "OpenAPI compliant REST API built using tRPC with Express",
    version: "1.0.0",
    baseUrl: `${env.BLOBSCAN_API_BASE_URL}`,
    docsUrl: "https://docs.blobscan.com/",
    tags: ["blobs", "transactions", "blocks", "stats", "indexer", "system"],
  });
  const blobPropagator = await getBlobPropagator();
  const createContext = createTRPCContext({
    blobPropagator,
    chainId: env.CHAIN_ID,
    enableTracing: env.TRACES_ENABLED,
    prisma,
    redis,
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
  });

  // Serve Swagger UI with our OpenAPI schema
  app.use("/", swaggerUi.serve);
  app.get("/", swaggerUi.setup(openApiDocument));

  // Handle incoming OpenAPI requests
  app.use(
    "/",
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    createOpenApiExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error }) {
        Sentry.captureException(error);

        logger.error(error);
      },
    })
  );
}
