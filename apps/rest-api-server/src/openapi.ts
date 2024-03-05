import { generateOpenApiDocument } from "trpc-openapi";

import { appRouter } from "@blobscan/api";

import { env } from "./env";

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Blobscan API",
  description: "OpenAPI compliant REST API built using tRPC with Express",
  version: "1.0.0",
  baseUrl: `${env.BLOBSCAN_API_BASE_URL}/api`,
  docsUrl: "https://docs.blobscan.com/",
  tags: ["blobs", "transactions", "blocks", "stats", "indexer", "system"],
});
