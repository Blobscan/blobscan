import {
  AddressModel,
  BlobDataStorageReferenceModel,
  BlobModel,
  BlobsOnTransactionsModel,
  BlockModel,
  TransactionModel,
} from "@blobscan/db/prisma/zod";
import {
  blobStorageSchema,
  dbCategorySchema,
  decimalSchema,
  hexSchema,
  lowercaseToUppercaseDBCategorySchema,
  lowercaseToUpercaseDBRollupSchema,
  optimismDecodedFieldsSchema,
} from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

export const toBigIntSchema = z.string().transform((value) => BigInt(value));

export const commaSeparatedValuesSchema = z
  .string()
  .optional()
  .transform((values) =>
    values
      ?.split(",")
      .map((v) => v.trim())
      .filter((v) => !!v.length)
  );

export const commaSeparatedRollupsSchema = commaSeparatedValuesSchema.transform(
  (values, ctx) =>
    values?.map((v) => {
      const res = lowercaseToUpercaseDBRollupSchema.safeParse(v);

      if (!res.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: {
            value: v,
          },
          message: "Provided rollup value is invalid",
        });

        return z.NEVER;
      }

      return res.data;
    })
);

export const commaSeparatedCategoriesSchema =
  commaSeparatedValuesSchema.transform((values, ctx) =>
    values?.map((v) => {
      const res = lowercaseToUppercaseDBCategorySchema.safeParse(v);

      if (!res.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: {
            value: v,
          },
          message: "Provided category value is invalid",
        });

        return z.NEVER;
      }

      return res.data;
    })
  );

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

export const prismaBlockSchema = BlockModel.omit({
  insertedAt: true,
  updatedAt: true,
});

export const blockDerivedFieldsSchema = z.object({
  blobBaseFee: decimalSchema,
  blobBaseUsdFee: z.string().optional(),
  blobGasUsdPrice: z.string().optional(),
});

export type BlockDerivedFields = z.output<typeof blockDerivedFieldsSchema>;

export const baseBlockSchema = prismaBlockSchema.merge(
  blockDerivedFieldsSchema
);

export const prismaBlobSchema = BlobModel.omit({
  firstBlockNumber: true,
  insertedAt: true,
  updatedAt: true,
}).extend({
  dataStorageReferences: z.array(
    BlobDataStorageReferenceModel.pick({
      blobStorage: true,
      dataReference: true,
    })
  ),
});

export const baseBlobSchema = prismaBlobSchema.extend({
  dataStorageReferences: z.array(
    z.object({
      storage: blobStorageSchema,
      url: z.string().url(),
    })
  ),
});

export const prismaTransactionSchema = TransactionModel.omit({
  insertedAt: true,
  updatedAt: true,
}).extend({
  from: AddressModel.pick({
    address: true,
    rollup: true,
  }),
});

export type PrismaTransaction = z.infer<typeof prismaTransactionSchema>;

export const prismaTransactionBlob = BlobsOnTransactionsModel.extend({
  blob: prismaBlobSchema,
});
export const prismaBlobOnTransactionSchema = BlobsOnTransactionsModel;

export const transactionDerivedFieldsSchema = z.object({
  blobAsCalldataGasFee: decimalSchema,
  blobAsCalldataGasUsdFee: z.string().optional(),
  blobGasBaseFee: decimalSchema,
  blobGasBaseUsdFee: z.string().optional(),
  blobGasMaxFee: decimalSchema,
  blobGasMaxUsdFee: z.string().optional(),
  blobGasUsdPrice: z.string().optional(),
});

export type TransactionDerivedFields = z.output<
  typeof transactionDerivedFieldsSchema
>;

export const baseTransactionSchema = prismaTransactionSchema
  .omit({
    fromId: true,
    toId: true,
    gasPrice: true,
  })
  .merge(transactionDerivedFieldsSchema)
  .extend({
    blobGasPrice: prismaBlockSchema.shape.blobGasPrice,
    category: dbCategorySchema,
    rollup: AddressModel.shape.rollup,
    from: AddressModel.shape.address,
    to: AddressModel.shape.address,
    decodedFields: optimismDecodedFieldsSchema.nullable(),
  });

export type PrismaBlob = z.input<typeof prismaBlobSchema>;

export type PrismaBlobOnTransaction = z.input<
  typeof prismaBlobOnTransactionSchema
>;
