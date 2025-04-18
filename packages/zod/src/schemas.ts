import { z } from "zod";

export const hashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]+$/, "Invalid hex string");

// We use this workaround instead of z.coerce.boolean.default(false)
// because it considers as "true" any value different than "false"
// (including the empty string).
export const booleanSchema = z
  .string()
  .refine((s) => s === "true" || s === "false")
  .transform((s) => s === "true");

export const commaSeparatedValuesSchema = z
  .string()
  .optional()
  .transform((values) =>
    values
      ?.split(",")
      .map((v) => v.trim())
      .filter((v) => !!v.length)
  );

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
