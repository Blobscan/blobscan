import { BlobStorage, Category, Rollup } from "@blobscan/db/prisma/enums";
import { z } from "@blobscan/zod";

const zodBlobStorageEnums = [
  "google",
  "swarm",
  "postgres",
  "file_system",
  "weavevm",
  "chunkstorm",
] as const;

const zodRollupEnums = [
  "abstract",
  "aevo",
  "ancient8",
  "arbitrum",
  "arenaz",
  "base",
  "blast",
  "bob",
  "boba",
  "camp",
  "debankchain",
  "ethernity",
  "fraxtal",
  "fuel",
  "hashkey",
  "hemi",
  "hypr",
  "infinaeon",
  "ink",
  "karak",
  "kinto",
  "kroma",
  "lambda",
  "linea",
  "lisk",
  "manta",
  "mantle",
  "metis",
  "metal",
  "metamail",
  "mint",
  "mode",
  "morph",
  "nal",
  "nanonnetwork",
  "opbnb",
  "optimism",
  "optopia",
  "orderly",
  "pandasea",
  "paradex",
  "parallel",
  "phala",
  "pgn",
  "polynomial",
  "r0ar",
  "race",
  "rari",
  "river",
  "scroll",
  "shape",
  "snaxchain",
  "soneium",
  "starknet",
  "superlumio",
  "superseed",
  "swanchain",
  "swellchain",
  "taiko",
  "thebinaryholdings",
  "unichain",
  "world",
  "xga",
  "zeronetwork",
  "zircuit",
  "zora",
  "zksync",
] as const;

const zodCategoryEnum = ["other", "rollup"] as const;

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

const missingCategoryEnums = Object.values(Category).filter(
  (r) =>
    !zodCategoryEnum.includes(
      r.toLowerCase() as (typeof zodCategoryEnum)[number]
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

if (missingCategoryEnums.length) {
  throw new Error(
    `Zod category enums is not in sync with Prisma category enums. Missing zod enums: ${missingCategoryEnums.join(
      ", "
    )}`
  );
}

export type ZodRollupEnum = (typeof zodRollupEnums)[number];

export type ZodBlobStorageEnum = (typeof zodBlobStorageEnums)[number];

export type ZodCategoryEnum = (typeof zodCategoryEnum)[number];

export const blobStorageSchema = z.enum(zodBlobStorageEnums);

// Use string and refine it as TRPC OpenAPI doesn't support enums yet
export const rollupSchema = z
  .string()
  .refine((value) => {
    return zodRollupEnums.includes(value as ZodRollupEnum);
  })
  .transform((value) => value as ZodRollupEnum);

export const categorySchema = z
  .string()
  .refine((value) => {
    return zodCategoryEnum.includes(value as ZodCategoryEnum);
  })
  .transform((value) => value as ZodCategoryEnum);

export const blockNumberSchema = z.number().nonnegative();

export const slotSchema = z.number().nonnegative();

export const hexSchema = z.string().regex(/^0x[0-9a-fA-F]+$/, {
  message: "Invalid hexadecimal string",
});

export const blockHashSchema = hexSchema.refine(
  (value) => value.length === 66,
  {
    message: "Block hashes must be 66 characters long",
  }
);

export const blobIndexSchema = z.number().nonnegative();

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
