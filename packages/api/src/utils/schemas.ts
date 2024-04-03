import { BlobStorage, Rollup } from "@blobscan/db";
import { z } from "@blobscan/zod";

const zodBlobStorageEnums = [
  "google",
  "swarm",
  "postgres",
  "file_system",
] as const;

const zodRollupEnums = [
  "arbitrum",
  "base",
  "optimism",
  "linea",
  "paradex",
  "scroll",
  "starknet",
  "zksync",
  "mode",
  "zora",
] as const;

/**
 * This is a type-safe way to get the enum values as we can't use `Object.values`
 * on zod enums directly
 */

const missingRollupEnums = Object.values(Rollup).filter(
  (r) =>
    !zodRollupEnums.includes(r.toLowerCase() as (typeof zodRollupEnums)[number])
);

const missingBlobStorageEnums = Object.values(BlobStorage).filter(
  (r) =>
    !zodBlobStorageEnums.includes(
      r.toLowerCase() as (typeof zodBlobStorageEnums)[number]
    )
);

if (missingRollupEnums.length) {
  throw new Error(
    `Zod rollup enums is not in sync with Prisma rollup enums. Missing zod enums: ${missingRollupEnums.join(
      ", "
    )}`
  );
}

if (missingBlobStorageEnums.length) {
  throw new Error(
    `Zod blob storage enums is not in sync with Prisma blob storage enums. Missing zod enums: ${missingBlobStorageEnums.join(
      ", "
    )}`
  );
}

export type ZodRollupEnum = (typeof zodRollupEnums)[number];

export type ZodBlobStorageEnum = (typeof zodBlobStorageEnums)[number];

export const blobStorageSchema = z.enum(zodBlobStorageEnums);

// Use string and refine it as TRPC OpenAPI doesn't support enums yet
export const rollupSchema = z
  .string()
  .refine((value) => {
    const isNull = value === null;
    const isRollupEnum = zodRollupEnums.includes(value as ZodRollupEnum);

    return isNull || isRollupEnum;
  })
  .transform((value) => value as ZodRollupEnum);

export const blockNumberSchema = z.number().nonnegative();

export const slotSchema = z.number().nonnegative();

export const blobIndexSchema = z.number().nonnegative();

export const addressSchema = z
  .string()
  .transform((value) => value.toLowerCase());
