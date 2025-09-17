import type {
  BlobscanPrismaClient,
  ExtendedBlockSelect,
  ExtendedTransactionSelect,
  Prisma,
} from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { ExtendedPrismaTransaction } from "../routers/tx/helpers";
import { t } from "../trpc-client";

const zodExpandEnums = ["blob", "block", "transaction"] as const;

export type ZodExpandEnum = (typeof zodExpandEnums)[number];

const expandedTransactionSelect = {
  blobAsCalldataGasFee: true,
  blobAsCalldataGasUsed: true,
  blobGasUsed: true,
  blobGasMaxFee: true,
  fromId: true,
  from: {
    select: {
      address: true,
      rollup: true,
      category: true,
    },
  },
  toId: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
  index: true,
  decodedFields: true,
  computeBlobGasBaseFee: true,
  computeUsdFields: true,
} satisfies ExtendedTransactionSelect;

export const expandedBlobSelect = {
  commitment: true,
  proof: true,
  size: true,
  usageSize: true,
} satisfies Prisma.BlobSelect;

const expandedBlockSelect = {
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  blobGasUsed: true,
  excessBlobGas: true,
  slot: true,
  blobGasBaseFee: true,
  computeUsdFields: true,
} satisfies ExtendedBlockSelect;

export type ExpandedBlock = NonNullable<
  Prisma.Result<
    BlobscanPrismaClient["block"],
    { select: typeof expandedBlockSelect },
    "findFirst"
  >
>;

export type ExpandedTransaction = NonNullable<
  Prisma.Result<
    BlobscanPrismaClient["transaction"],
    { select: typeof expandedTransactionSelect },
    "findFirst"
  >
> & { decodedFields: NonNullable<ExtendedPrismaTransaction["decodedFields"]> };

export type ExpandedBlob = Prisma.BlobGetPayload<{
  select: typeof expandedBlobSelect;
}>;

export type ExpandedBlobWithData = ExpandedBlob & { data?: string };

export type ZodExpand = (typeof zodExpandEnums)[number];

export type ExpandSelect<T> = { select: T };

export type Expands = Partial<{
  transaction: ExpandSelect<typeof expandedTransactionSelect>;
  blob: ExpandSelect<typeof expandedBlobSelect>;
  block: ExpandSelect<typeof expandedBlockSelect>;
}>;

export function createExpandsSchema(allowedExpands: ZodExpand[]) {
  return z.object({
    expand: z
      .string()
      .refine(
        (value) => {
          const values = value.split(",");

          return values.every((v) => allowedExpands.includes(v as ZodExpand));
        },
        {
          message: `Invalid 'expand' query search. It must be a comma separated list of the following values: ${allowedExpands.join(
            ", "
          )}`,
        }
      )
      .optional(),
  });
}

const allExpandKeysSchema = createExpandsSchema([
  "blob",
  "block",
  "transaction",
]);

export const withExpands = t.middleware(({ next, input }) => {
  const expandResult = allExpandKeysSchema.safeParse(input);
  let expandKeys: ZodExpand[] = [];

  if (expandResult.success && expandResult.data.expand) {
    expandKeys = expandResult.data.expand
      .split(",")
      .map((expand) => expand as ZodExpand);
  }

  const expands = expandKeys.reduce<Expands>((exp, current) => {
    switch (current) {
      case "transaction":
        exp.transaction = { select: expandedTransactionSelect };
        break;
      case "blob":
        exp.blob = { select: expandedBlobSelect };
        break;
      case "block":
        exp.block = { select: expandedBlockSelect };
        break;
    }

    return exp;
  }, {});

  return next({
    ctx: {
      expands,
    },
  });
});
