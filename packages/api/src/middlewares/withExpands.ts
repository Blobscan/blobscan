import type { Prisma } from "@blobscan/db";
import {
  AddressModel,
  BlobDataStorageReferenceModel,
  BlobModel,
  BlockModel,
  TransactionModel,
} from "@blobscan/db/prisma/zod";
import {
  blobStorageSchema,
  toCategorySchema,
  toRollupSchema,
  stringifyDecimalSchema,
} from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import type { Category } from "../../enums";
import { t } from "../trpc-client";
import type { TransactionFeeFields } from "../utils";
import {
  buildBlobDataUrl,
  serializedTransactionFeeFieldsSchema,
} from "../utils";
import { transactionFeeFieldsSchema } from "../utils";

const zodExpandEnums = ["blob", "blob_data", "block", "transaction"] as const;

export type ZodExpandEnum = (typeof zodExpandEnums)[number];

const expandedTransactionSelect = {
  blobAsCalldataGasUsed: true,
  blobGasUsed: true,
  fromId: true,
  from: {
    select: {
      address: true,
      rollup: true,
    },
  },
  toId: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
  index: true,
  decodedFields: true,
} satisfies Prisma.TransactionSelect;

export const expandedBlobSelect = {
  commitment: true,
  proof: true,
  size: true,
  dataStorageReferences: {
    select: {
      blobStorage: true,
      dataReference: true,
    },
    orderBy: {
      blobStorage: "asc",
    },
  },
} satisfies Prisma.BlobSelect;

const expandedBlockSelect = {
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  blobGasUsed: true,
  excessBlobGas: true,
  slot: true,
} satisfies Prisma.BlockSelect;

export const expandedBlockSchema = BlockModel.omit({
  hash: true,
  insertedAt: true,
  updatedAt: true,
  number: true,
  timestamp: true,
});

export const serializedExpandedBlockSchema = expandedBlockSchema
  .partial()
  .transform(
    ({
      blobGasUsed,
      blobAsCalldataGasUsed,
      blobGasPrice,
      excessBlobGas,
      ...restBlock
    }) => ({
      ...restBlock,
      blobGasUsed: stringifyDecimalSchema.parse(blobGasUsed),
      blobAsCalldataGasUsed: stringifyDecimalSchema.parse(
        blobAsCalldataGasUsed
      ),
      blobGasPrice: stringifyDecimalSchema.parse(blobGasPrice),
      excessBlobGas: stringifyDecimalSchema.parse(excessBlobGas),
    })
  );

export const expandedTransactionSchema = TransactionModel.omit({
  hash: true,
  blockHash: true,
  blockNumber: true,
  blockTimestamp: true,
  insertedAt: true,
  updatedAt: true,
})
  .merge(transactionFeeFieldsSchema)
  .extend({
    from: AddressModel.pick({
      address: true,
      rollup: true,
    }),
  });

export const serializedExpandedTransactionSchema =
  expandedTransactionSchema.transform(
    ({
      blobAsCalldataGasUsed,
      blobGasUsed,
      decodedFields,
      from,
      fromId,
      toId,
      maxFeePerBlobGas,
      blobAsCalldataGasFee,
      blobGasBaseFee,
      blobGasMaxFee,
      gasPrice: _,
      ...restTx
    }) => {
      const category: Category = from.rollup ? "ROLLUP" : "OTHER";
      const txFeeFields = serializedTransactionFeeFieldsSchema.parse({
        blobAsCalldataGasFee,
        blobGasBaseFee,
        blobGasMaxFee,
      });

      return {
        ...restTx,
        ...txFeeFields,
        ...(from.rollup ? { rollup: toRollupSchema.parse(from.rollup) } : {}),
        ...(decodedFields && Object.values(decodedFields).length
          ? { decodedFields }
          : {}),
        blobAsCalldataGasUsed: stringifyDecimalSchema.parse(
          blobAsCalldataGasUsed
        ),
        category: toCategorySchema.parse(category),
        from: fromId,
        to: toId,
        blobGasUsed: stringifyDecimalSchema.parse(blobGasUsed),
        maxFeePerBlobGas: stringifyDecimalSchema.parse(maxFeePerBlobGas),
      };
    }
  );

export const expandedBlobSchema = BlobModel.omit({
  firstBlockNumber: true,
  versionedHash: true,
  insertedAt: true,
  updatedAt: true,
})
  .extend({
    dataStorageReferences: z.array(
      BlobDataStorageReferenceModel.pick({
        blobStorage: true,
        dataReference: true,
      })
    ),
  })
  .extend({
    data: z.string().optional(),
  });

export const serializedExpandedBlobSchema = expandedBlobSchema.transform(
  ({ dataStorageReferences, ...restBlob }) => ({
    ...restBlob,
    dataStorageReferences: dataStorageReferences.map(
      ({ blobStorage, dataReference }) => ({
        storage: blobStorageSchema.parse(blobStorage),
        url: buildBlobDataUrl(blobStorage, dataReference),
      })
    ),
  })
);

export type ExpandedBlock = Prisma.BlockGetPayload<{
  select: typeof expandedBlockSelect;
}>;

export type ExpandedTransaction = Prisma.TransactionGetPayload<{
  select: typeof expandedTransactionSelect;
}> &
  Partial<TransactionFeeFields>;

export type ExpandedBlob = Prisma.BlobGetPayload<{
  select: typeof expandedBlobSelect;
}> & {
  data?: string;
};

export type ExpandedBlobWithData = ExpandedBlob & { data?: string };

export type ZodExpand = (typeof zodExpandEnums)[number];

export type ExpandSelect<T> = { select: T };

export type Expands = Partial<{
  transaction: ExpandSelect<typeof expandedTransactionSelect>;
  blob: ExpandSelect<typeof expandedBlobSelect>;
  blobData: boolean;
  block: ExpandSelect<typeof expandedBlockSelect>;
}>;

export type SerializedExpandedBlob = z.infer<
  typeof serializedExpandedBlobSchema
>;

export type SerializedExpandedBlock = z.infer<
  typeof serializedExpandedBlockSchema
>;
export type SerializedExpandedTransaction = z.infer<
  typeof serializedExpandedTransactionSchema
>;

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
  "blob_data",
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
      case "blob_data": {
        exp.blobData = true;
        // We need to expand the blob data as well
        exp.blob = { select: expandedBlobSelect };
        break;
      }
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
