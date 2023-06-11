import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-openapi";

import {
  appRouter,
  createExpressMiddleware,
  createTRPCContext,
} from "@blobscan/api";

import { PORT } from "./env";
import { openApiDocument } from "./openapi";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// Handle incoming tRPC requests
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

// Handle incoming OpenAPI requests
app.use(
  "/api",
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
