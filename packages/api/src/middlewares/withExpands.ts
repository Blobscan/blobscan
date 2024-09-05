import { Prisma } from "@blobscan/db";
import type {
  BlobDataStorageReference,
  Blob as DBBlob,
  Block as DBBlock,
  Transaction as DBTransaction,
} from "@blobscan/db";
import { z } from "@blobscan/zod";

import { t } from "../trpc-client";
import {
  categorySchema,
  dataStorageReferencesSelect,
  rollupSchema,
  serializeBlobDataStorageReferences,
  serializeCategory,
  serializeDecimal,
  serializeRollup,
  serializedBlobDataStorageReferenceSchema,
  slotSchema,
} from "../utils";
import type { DerivedTxBlobGasFields, MakeFieldsMandatory } from "../utils";

const zodExpandEnums = ["blob", "blob_data", "block", "transaction"] as const;

export type ZodExpandEnum = (typeof zodExpandEnums)[number];

const expandedTransactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  blobAsCalldataGasUsed: true,
  fromId: true,
  toId: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
  category: true,
  rollup: true,
  index: true,
});

const expandedBlobSelect = Prisma.validator<Prisma.BlobSelect>()({
  commitment: true,
  proof: true,
  size: true,
  dataStorageReferences: {
    select: dataStorageReferencesSelect,
  },
});

const expandedBlockSelect = Prisma.validator<Prisma.BlockSelect>()({
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  blobGasUsed: true,
  excessBlobGas: true,
  slot: true,
});

export type ExpandedBlock = Partial<DBBlock>;

export type ExpandedTransaction = Partial<DBTransaction> &
  Partial<DerivedTxBlobGasFields>;

export type ExpandedBlob = MakeFieldsMandatory<
  DBBlob & {
    dataStorageReferences: Pick<
      BlobDataStorageReference,
      "blobStorage" | "dataReference"
    >[];
    data?: string;
  },
  "versionedHash"
>;

export type ExpandedBlobData = MakeFieldsMandatory<
  DBBlob & {
    dataStorageReferences: Pick<
      BlobDataStorageReference,
      "blobStorage" | "dataReference"
    >[];
    data?: string;
  },
  "versionedHash"
>;

export type ZodExpand = (typeof zodExpandEnums)[number];

export type ExpandSelect<T> = { select: T };

export type Expands = {
  transaction?: ExpandSelect<typeof expandedTransactionSelect>;
  blob?: ExpandSelect<typeof expandedBlobSelect>;
  blobData?: boolean;
  block?: ExpandSelect<typeof expandedBlockSelect>;
};

export const serializedExpandedBlockSchema = z.object({
  blobGasUsed: z.string().optional(),
  blobAsCalldataGasUsed: z.string().optional(),
  blobGasPrice: z.string().optional(),
  excessBlobGas: z.string().optional(),
  slot: slotSchema.optional(),
});

export const serializedExpandedBlobSchema = z.object({
  commitment: z.string().optional(),
  proof: z.string().optional(),
  size: z.number().optional(),
  dataStorageReferences: z
    .array(serializedBlobDataStorageReferenceSchema)
    .optional(),
  index: z.number().nonnegative().optional(),
});

export const serializedExpandedBlobDataSchema = z
  .object({
    data: z.string().optional(),
  })
  .merge(serializedExpandedBlobSchema);

export const serializedExpandedTransactionSchema = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
    maxFeePerBlobGas: z.string().optional(),
    blobAsCalldataGasUsed: z.string().optional(),
    category: categorySchema.optional(),
    rollup: rollupSchema.nullable().optional(),
    index: z.number().nonnegative().optional(),
  })
  .merge(
    z.object({
      blobAsCalldataGasFee: z.string().optional(),
      blobGasBaseFee: z.string().optional(),
      blobGasMaxFee: z.string().optional(),
      blobGasUsed: z.string().optional(),
    })
  );

export type SerializedExpandedBlob = z.infer<
  typeof serializedExpandedBlobSchema
>;

export type SerializedExpandedBlobData = z.infer<
  typeof serializedExpandedBlobDataSchema
>;

export type SerializedExpandedBlock = z.infer<
  typeof serializedExpandedBlockSchema
>;
export type SerializedExpandedTransaction = z.infer<
  typeof serializedExpandedTransactionSchema
>;

export function serializeExpandedBlob(
  blob: ExpandedBlob
): SerializedExpandedBlob {
  const { commitment, proof, size, dataStorageReferences } = blob;
  const expandedBlob: SerializedExpandedBlob = {};

  if (commitment) {
    expandedBlob.commitment = commitment;
  }

  if (proof) {
    expandedBlob.proof = proof;
  }

  if (size) {
    expandedBlob.size = size;
  }

  if (dataStorageReferences) {
    expandedBlob.dataStorageReferences = serializeBlobDataStorageReferences(
      dataStorageReferences
    );
  }

  return expandedBlob;
}

export function serializeExpandedBlobData(blob: ExpandedBlobData) {
  const serializedBlob: SerializedExpandedBlobData =
    serializeExpandedBlob(blob);

  if (blob.data) {
    serializedBlob.data = blob.data;
  }

  return serializedBlob;
}

export function serializeExpandedBlock(
  block: ExpandedBlock
): SerializedExpandedBlock {
  const {
    blobGasPrice,
    blobAsCalldataGasUsed,
    blobGasUsed,
    excessBlobGas,
    slot,
  } = block;
  const expandedBlock: SerializedExpandedBlock = {};

  if (blobGasPrice) {
    expandedBlock.blobGasPrice = serializeDecimal(blobGasPrice);
  }

  if (blobAsCalldataGasUsed) {
    expandedBlock.blobAsCalldataGasUsed = serializeDecimal(
      blobAsCalldataGasUsed
    );
  }

  if (blobGasUsed) {
    expandedBlock.blobGasUsed = serializeDecimal(blobGasUsed);
  }

  if (excessBlobGas) {
    expandedBlock.excessBlobGas = serializeDecimal(excessBlobGas);
  }

  if (slot) {
    expandedBlock.slot = slot;
  }

  return expandedBlock;
}

export function serializeExpandedTransaction(
  transaction: ExpandedTransaction
): SerializedExpandedTransaction {
  const {
    blobAsCalldataGasUsed,
    maxFeePerBlobGas,
    fromId,
    toId,
    category,
    rollup,
    blobAsCalldataGasFee,
    blobGasBaseFee,
    blobGasMaxFee,
    blobGasUsed,
    index,
  } = transaction;
  const expandedTransaction: SerializedExpandedTransaction = {};

  if (blobAsCalldataGasUsed) {
    expandedTransaction.blobAsCalldataGasUsed = serializeDecimal(
      blobAsCalldataGasUsed
    );
  }

  if (maxFeePerBlobGas) {
    expandedTransaction.maxFeePerBlobGas = serializeDecimal(maxFeePerBlobGas);
  }

  if (fromId) {
    expandedTransaction.from = fromId;
  }

  if (toId) {
    expandedTransaction.to = toId;
  }

  if (category) {
    expandedTransaction.category = serializeCategory(category);
  }

  if (rollup) {
    expandedTransaction.rollup = serializeRollup(rollup);
  }

  if (blobGasBaseFee) {
    expandedTransaction.blobGasBaseFee = serializeDecimal(blobGasBaseFee);
  }

  if (blobGasMaxFee) {
    expandedTransaction.blobGasMaxFee = serializeDecimal(blobGasMaxFee);
  }

  if (blobGasUsed) {
    expandedTransaction.blobGasUsed = serializeDecimal(blobGasUsed);
  }

  if (blobAsCalldataGasFee) {
    expandedTransaction.blobAsCalldataGasFee =
      serializeDecimal(blobAsCalldataGasFee);
  }

  if (index !== undefined && index !== null) {
    expandedTransaction.index = index;
  }

  return expandedTransaction;
}

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
