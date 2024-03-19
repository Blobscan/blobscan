import { BlobStorage, Rollup } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { paginationSchema } from "../middlewares/withPagination";

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

export const blobStorageSchema = z.enum(zodBlobStorageEnums);

export const rollupSchema = z.enum(zodRollupEnums);

export const sortSchema = z.enum(["asc", "desc"]).default("desc");

export const blockNumberSchema = z.number().nonnegative();

export const slotSchema = z.number().nonnegative();

export const blobIndexSchema = z.number().nonnegative();

export const typeSchema = z
  .enum(["reorg", "finalized", "normal"])
  .default("normal");

export const baseGetAllInputSchema = z
  .object({
    rollup: rollupSchema
      .transform<Rollup>((rollup) => {
        return rollup.toUpperCase() as Rollup;
      })
      .optional(),
    startBlock: blockNumberSchema.optional(),
    endBlock: blockNumberSchema.optional(),
    startSlot: slotSchema.optional(),
    endSlot: slotSchema.optional(),
    sort: sortSchema,
    type: typeSchema,
  })
  .merge(paginationSchema)
  .default({
    p: 1,
    ps: 25,
    sort: "desc",
    type: "normal",
  });

// Zod infers `rollup` field as
export type BaseGetAllInput =
  | Omit<z.infer<typeof baseGetAllInputSchema>, "rollup"> & {
      rollup?: Lowercase<Rollup>;
    };
