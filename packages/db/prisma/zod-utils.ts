import { Prisma } from "@prisma/client";

import { z } from "@blobscan/zod";

import {
  BlobStorage as DBBlobStorageEnum,
  Rollup as DBRollupEnum,
} from "./enums";
import { Category as DBCategoryEnum } from "./enums";

export const hexSchema = z.string().regex(/^0x[0-9a-fA-F]+$/, {
  message: "Invalid hexadecimal string",
});

export const hashSchema = hexSchema.length(66);

export const blockHashSchema = hexSchema.length(
  66,
  "Invalid block hash length"
);

export const blockNumberSchema = z.coerce.number().int().positive();

export const addressSchema = hexSchema.length(42, "Invalid address length");

export const blobProofSchema = hexSchema.length(
  98,
  "Invalid blob proof length"
);

export const blobCommitmentSchema = hexSchema.length(
  98,
  "Invalid blob commitment or proof length"
);

export const blobVersionedHashSchema = hexSchema.length(66).startsWith("0x01");

export const decimalSchema = z.instanceof(Prisma.Decimal);

export const nonNegativeDecimalSchema = decimalSchema.refine(
  (value) => value.gte(0),
  {
    message: "Value must be greater than or equal to 0",
  }
);

// TODO: create helper to checksum addresses

export const dbRollupSchema = z.nativeEnum(DBRollupEnum);

const LOWERCASE_DB_ROLLUP_ENUM = Object.entries(DBRollupEnum).reduce(
  (acc, [key, value]) => {
    acc[key.toLowerCase() as Lowercase<keyof typeof DBRollupEnum>] =
      value.toLowerCase() as Lowercase<DBRollupEnum>;
    return acc;
  },
  {} as Record<Lowercase<keyof typeof DBRollupEnum>, Lowercase<DBRollupEnum>>
);

export const lowercaseDBRollupSchema = z.nativeEnum(LOWERCASE_DB_ROLLUP_ENUM);

export const lowercaseToUpercaseDBRollupSchema =
  lowercaseDBRollupSchema.transform<Uppercase<DBRollupEnum>>(
    (value) => value.toUpperCase() as Uppercase<DBRollupEnum>
  );

export const toRollupSchema = dbRollupSchema.transform<Lowercase<DBRollupEnum>>(
  (value) => value.toLowerCase() as Lowercase<DBRollupEnum>
);

export const nullishToRollupSchema = toRollupSchema.nullish();

export const dbRollupCoercionSchema = z
  .string()
  .refine((v) => {
    const result = dbRollupSchema.safeParse(v.toUpperCase());

    if (!result.success) {
      return false;
    }

    return true;
  })
  .transform((value, ctx) => {
    const result = dbRollupSchema.safeParse(value.toUpperCase());

    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid rollup",
      });

      return z.NEVER;
    }

    return result.data;
  });

export const dbBlobStorageSchema = z.nativeEnum(DBBlobStorageEnum);

export const blobStorageSchema = dbBlobStorageSchema.transform<
  Lowercase<DBBlobStorageEnum>
>((value) => value.toLowerCase() as Lowercase<DBBlobStorageEnum>);

export const dbBlobStorageCoercionSchema = z
  .string()
  .transform((value, ctx) => {
    const result = dbBlobStorageSchema.safeParse(value);

    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid blob storage",
      });

      return z.NEVER;
    }

    return result.data;
  });

export const dbCategorySchema = z.nativeEnum(DBCategoryEnum);

const LOWERCASE_DB_CATEGORY_ENUM = Object.entries(DBCategoryEnum).reduce(
  (acc, [key, value]) => {
    acc[key.toLowerCase() as Lowercase<keyof typeof DBCategoryEnum>] =
      value.toLowerCase() as Lowercase<DBCategoryEnum>;
    return acc;
  },
  {} as Record<
    Lowercase<keyof typeof DBCategoryEnum>,
    Lowercase<DBCategoryEnum>
  >
);

export const lowercaseDBCategorySchema = z.nativeEnum(
  LOWERCASE_DB_CATEGORY_ENUM
);

export const lowercaseToUppercaseDBCategorySchema =
  lowercaseDBCategorySchema.transform<Uppercase<DBCategoryEnum>>(
    (value) => value.toUpperCase() as Uppercase<DBCategoryEnum>
  );

export const toCategorySchema = dbCategorySchema.transform<
  Lowercase<DBCategoryEnum>
>((value) => value.toLowerCase() as Lowercase<DBCategoryEnum>);

export const nullishToCategorySchema = toCategorySchema.nullish();

export const dbCategoryCoercionSchema = z.string().transform((value, ctx) => {
  const result = dbCategorySchema.safeParse(value.toUpperCase());

  if (!result.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid category",
    });

    return z.NEVER;
  }

  return result.data;
});

export const dbEnumSchema = dbCategorySchema
  .or(dbRollupSchema)
  .or(dbBlobStorageSchema);

export type DBEnum = z.infer<typeof dbEnumSchema>;

export const optimismDecodedFieldsSchema = z.object({
  timestampSinceL2Genesis: z.number(),
  lastL1OriginNumber: z.number(),
  parentL2BlockHash: z.string(),
  l1OriginBlockHash: z.string(),
  numberOfL2Blocks: z.number(),
  changedByL1Origin: z.number(),
  totalTxs: z.number(),
  contractCreationTxsNumber: z.number(),
});

export type OptimismDecodedFields = z.input<typeof optimismDecodedFieldsSchema>;

export const decodedFieldsSchema = optimismDecodedFieldsSchema.or(z.object({}));
