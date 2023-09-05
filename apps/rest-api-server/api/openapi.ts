import { generateOpenApiDocument } from "trpc-openapi";

import { appRouter } from "@blobscan/api";

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Blobscan API",
  description: "OpenAPI compliant REST API built using tRPC with Express",
  version: "1.0.0",
  baseUrl: `https://api.blobscan.com/api`,
  docsUrl: "https://docs.blobscan.com/",
  tags: ["blobs", "blocks", "transactions", "overall", "system"],
});
