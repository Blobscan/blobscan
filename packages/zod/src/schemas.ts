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
