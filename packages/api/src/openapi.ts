import type { CreateDocumentOptions } from "zod-openapi";

import { z } from "@blobscan/zod";

function applyScalarOverrides(jsonSchema: object, zodType: string) {
  const schema = jsonSchema as Record<string, unknown>;

  if (zodType === "date") {
    schema.type = "string";
    schema.format = "date-time";
  } else if (zodType === "bigint") {
    schema.type = "integer";
    schema.format = "int64";
  } else if (zodType === "nan") {
    schema.type = "number";
  }
}

/**
 * `trpc-to-openapi` generates both input and output schemas. Zod
 * transformations cannot be represented in output schemas, so render the
 * pre-transform (input) shape instead. This matches the REST payloads, which
 * are JSON values rather than the normalized TypeScript values.
 */
export const openApiOverride: NonNullable<
  CreateDocumentOptions["override"]
> = ({ jsonSchema, zodSchema, io }) => {
  const def = zodSchema._zod.def;

  if (io === "output" && def.type === "pipe") {
    const inputJsonSchema = z.toJSONSchema(def.in, {
      io: "input",
      target: "openapi-3.0",
      reused: "inline",
      unrepresentable: "any",
      override: ({
        jsonSchema: scalarJsonSchema,
        zodSchema: scalarZodSchema,
      }) => {
        applyScalarOverrides(scalarJsonSchema, scalarZodSchema._zod.def.type);
      },
    });

    delete inputJsonSchema.$schema;
    Object.assign(jsonSchema, inputJsonSchema);
  }

  applyScalarOverrides(jsonSchema, def.type);
};
