import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-openapi";

import { appRouter, createTRPCContext } from "@blobscan/api";

import { env } from "./env";
import { logger } from "./logger";
import { morganMiddleware } from "./middlewares/morgan";
import { openApiDocument } from "./openapi";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morganMiddleware);

// Handle incoming OpenAPI requests
app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
    onError({ error, ctx }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        logger.error(error);
      }
    },
  })
);

// Serve Swagger UI with our OpenAPI schema
app.use("/", swaggerUi.serve);
app.get("/", swaggerUi.setup(openApiDocument));

app.listen(env.BLOBSCAN_API_PORT, () => {
  console.log(
    `REST API server started on http://0.0.0.0:${env.BLOBSCAN_API_PORT}`
  );
});
