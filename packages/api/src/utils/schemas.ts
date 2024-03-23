import { BlobStorage, Rollup } from "@blobscan/db";
import { z } from "@blobscan/zod";

const zodBlobStorageEnums = ["google", "swarm", "postgres"] as const;

const zodRollupEnums = [
  "arbitrum",
  "base",
  "optimism",
  "scroll",
  "starknet",
  "zksync",
  "mode",
  "zora",
] as const;

const zodExpandEnums = ["blob", "blob_data", "block", "transaction"] as const;

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

export type ZodExpandEnum = (typeof zodExpandEnums)[number];

export type ZodBlobStorageEnum = (typeof zodBlobStorageEnums)[number];

export const blobStorageSchema = z.enum(zodBlobStorageEnums);

export const rollupSchema = z.enum(zodRollupEnums).nullable();

export const blockNumberSchema = z.number().nonnegative();

export const slotSchema = z.number().nonnegative();

export const blobIndexSchema = z.number().nonnegative();

export const expandSchema = z
  .string()
  .refine(
    (value) => {
      const values = value.split(",");

      return values.every((v) => zodExpandEnums.includes(v as ZodExpandEnum));
    },
    {
      message: `Invalid 'expand' value. It must be a comma separated list of the following values: ${zodExpandEnums.join(
        ", "
      )}`,
    }
  )
  .transform((value) => value.split(",") as ZodExpandEnum[]);
