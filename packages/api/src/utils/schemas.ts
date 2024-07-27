import { BlobStorage, Category } from "@blobscan/db";
import { z } from "@blobscan/zod";

const zodBlobStorageEnums = [
  "google",
  "swarm",
  "postgres",
  "file_system",
] as const;

const categoryEnums = [
  "arbitrum",
  "base",
  "blast",
  "boba",
  "camp",
  "kroma",
  "linea",
  "metal",
  "optimism",
  "optopia",
  "paradex",
  "pgn",
  "scroll",
  "starknet",
  "taiko",
  "zksync",
  "mode",
  "zora",
  "unknown",
] as const;

/**
 * This is a type-safe way to get the enum values as we can't use `Object.values`
 * on zod enums directly
 */

const missingCategoryEnums = Object.values(Category).filter(
  (r) =>
    !categoryEnums.includes(r.toLowerCase() as (typeof categoryEnums)[number])
);

const missingBlobStorageEnums = Object.values(BlobStorage).filter(
  (r) =>
    !zodBlobStorageEnums.includes(
      r.toLowerCase() as (typeof zodBlobStorageEnums)[number]
    )
);

if (missingCategoryEnums.length) {
  throw new Error(
    `Zod category enums is not in sync with Prisma category enums. Missing zod enums: ${missingCategoryEnums.join(
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

export type ZodCategoryEnum = (typeof categoryEnums)[number];

export type ZodBlobStorageEnum = (typeof zodBlobStorageEnums)[number];

export const blobStorageSchema = z.enum(zodBlobStorageEnums);

// Use string and refine it as TRPC OpenAPI doesn't support enums yet
export const categorySchema = z
  .string()
  .refine((value) => {
    return categoryEnums.includes(value as ZodCategoryEnum);
  })
  .transform((value) => value as ZodCategoryEnum);

export const nullableCategorySchema = z
  .string()
  .refine((value) => {
    return value === "null" || categoryEnums.includes(value as ZodCategoryEnum);
  })
  .transform((value) => value as ZodCategoryEnum | "null");

export const blockNumberSchema = z.number().nonnegative();

export const slotSchema = z.number().nonnegative();

export const blobIndexSchema = z.number().nonnegative();

export const hexSchema = z.string().regex(/^0x[0-9a-fA-F]+$/, {
  message: "Invalid hexadecimal string",
});

export const addressSchema = z
  .string()
  .transform((value) => value.toLowerCase());

export const blobVersionedHashSchema = hexSchema.length(66).startsWith("0x01");

export const blobCommitmentSchema = hexSchema.length(98);

export const blobIdSchema = z
  .string()
  .superRefine((val, ctx) => {
    if (!hexSchema.safeParse(val).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_string,
        message: "Invalid input: must be a valid hex string",
        validation: "regex",
        fatal: true,
      });

      return z.NEVER;
    }

    if (val.length !== 66 && val.length !== 98) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Invalid input length: must be a versioned hash (32 bytes) or a kzg commitment (48 bytes)",
        fatal: true,
      });

      return z.NEVER;
    }

    if (val.length === 66 && !val.startsWith("0x01")) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_string,
        message: 'Invalid versioned hash: must start with "0x01"',
        validation: "regex",
        fatal: true,
      });

      return z.NEVER;
    }
  })
  .describe(
    "Blob identifier. It can be the blob's versioned hash or kzg commitment."
  );
