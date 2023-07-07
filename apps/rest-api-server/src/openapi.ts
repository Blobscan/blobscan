import { generateOpenApiDocument } from "trpc-openapi";

import { appRouter } from "@blobscan/api";

import { env } from "./env";

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Blobscan API",
  description: "OpenAPI compliant REST API built using tRPC with Express",
  version: "0.0.1",
  baseUrl: `http://localhost:${env.BLOBSCAN_API_PORT}/api`,
  docsUrl: "https://docs-blobscan-com.vercel.app/",
  tags: ["auth", "blocks", "blobs", "transactions"],
});
