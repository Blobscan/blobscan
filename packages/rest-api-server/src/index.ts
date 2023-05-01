import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-openapi";

import { appRouter, createTRPCContext } from "@blobscan/api";

import { PORT } from "./env";
import { openApiDocument } from "./openapi";

const app = express();

app.use(cors());

// Handle incoming OpenAPI requests
app.use("/api", () =>
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

// Serve Swagger UI with our OpenAPI schema
app.use("/", swaggerUi.serve);
app.get("/", swaggerUi.setup(openApiDocument));

app.listen(PORT, () => {
  console.log(`REST API server started on http://localhost:${PORT}`);
});
