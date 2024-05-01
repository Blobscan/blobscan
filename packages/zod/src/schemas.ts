import { z } from "zod";

// We use this workaround instead of z.coerce.boolean.default(false)
// because it considers as "true" any value different than "false"
// (including the empty string).
export const booleanSchema = z
  .string()
  .refine((s) => s === "true" || s === "false")
  .transform((s) => s === "true");

export const toBigIntSchema = z.string().transform((value) => BigInt(value));

export const nodeEnvSchema = z.enum(["development", "test", "production"]);

export const prismaBatchOperationsMaxSizeSchema = z.coerce
  .number()
  .positive()
  .default(100_000);

export const networkSchema = z.enum([
  "mainnet",
  "holesky",
  "sepolia",
  "gnosis",
  "chiado",
  "devnet",
]);

export const blobStorageSchema = z.enum([
  "FILE_SYSTEM",
  "GOOGLE",
  "POSTGRES",
  "SWARM",
] as const);

export function conditionalRequiredSchema<T extends z.ZodTypeAny>(
  schema: T,
  conditionalField?: string,
  expectedValue?: string,
  errorMessage?: string
) {
  return schema.optional().refine(
    (value) => {
      const isConditionalFieldSet = conditionalField === expectedValue;

      return !isConditionalFieldSet || !!value;
    },
    {
      message: errorMessage,
    }
  );
}
