import { generateOpenApiDocument } from "trpc-to-openapi";
import { describe, expect, it } from "vitest";

import { createAppRouter } from "../src/app-router";
import { openApiOverride } from "../src/openapi";

describe("OpenAPI document", () => {
  it("generates a document with transformed output schemas", () => {
    const document = generateOpenApiDocument(createAppRouter(), {
      title: "Blobscan API",
      description: "OpenAPI compliant REST API built using tRPC with Express",
      version: "1.0.0",
      baseUrl: "http://localhost:3000",
      tags: ["blobs", "transactions", "blocks", "stats", "indexer", "system"],
      openApiVersion: "3.0.3",
      options: {
        override: openApiOverride,
      },
    });

    expect(document.openapi).toBe("3.0.3");
    expect(document.paths?.["/transactions/{hash}"]).toBeDefined();
    expect(JSON.stringify(document.paths?.["/transactions/{hash}"])).toContain(
      '"blobGasUsed"'
    );
  });
});
