import { generateOpenApiDocument } from "trpc-openapi";

import { appRouter } from "@blobscan/api";

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Blobscan CRUD API",
  description: "OpenAPI compliant REST API built using tRPC with Next.js",
  version: "0.1.0",
  baseUrl: "http://localhost:3000/api",
  docsUrl: "https://docs-blobscan-com.vercel.app",
  tags: ["auth", "blocks", "blobs", "transactions"],
});
