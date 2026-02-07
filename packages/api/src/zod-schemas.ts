import type { Category, Rollup } from "@blobscan/db/prisma/enums";
import {
  blockAllComputedFieldsSchema,
  transactionAllComputedFieldsSchema,
} from "@blobscan/db/prisma/extensions";
import {
  AddressModel,
  BlobDataStorageReferenceModel,
  BlobModel,
  BlobsOnTransactionsModel,
  BlockModel,
  DailyStatsModel,
  TransactionModel,
} from "@blobscan/db/prisma/zod";
import {
  blobStorageSchema,
  dbCategorySchema,
  hexSchema,
  lowercaseToUppercaseDBCategorySchema,
  lowercaseToUpercaseDBRollupSchema,
  optimismDecodedFieldsSchema,
  dbRollupSchema,
} from "@blobscan/db/prisma/zod-utils";
import { logLevelEnum } from "@blobscan/logger";
import { z } from "@blobscan/zod";

export const dimensionSchema = z
  .object({
    type: z.literal("global"),
  })
  .or(
    z.object({
      type: z.literal("category"),
      name: dbCategorySchema,
    })
  )
  .or(
    z.object({
      type: z.literal("rollup"),
      name: dbRollupSchema,
    })
  );

export type Dimension = z.output<typeof dimensionSchema>;

export function getDimension(
  category: Category | null,
  rollup?: Rollup | null
): Dimension {
  if (rollup) {
    return {
      type: "rollup",
      name: rollup,
    };
  }

  if (category) {
    return {
      type: "category",
      name: category,
    };
  }

  return {
    type: "global",
  };
}

export const timeseriesMetricsSchema = DailyStatsModel.omit({
  id: true,
  day: true,
  category: true,
  rollup: true,
});

export const toLogLevelSchema = z.string().transform((value, ctx) => {
  const result = logLevelEnum.safeParse(value);
  if (!result.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      params: {
        value,
      },
      message: "Log level provided is invalid",
    });

    return z.NEVER;
  }

  return result.data;
});

export const toBigIntSchema = z.string().transform((value) => BigInt(value));

export function arrayOptionalizeShape<T extends z.ZodRawShape>(
  shape: T
): {
  [K in keyof T]: z.ZodOptional<z.ZodArray<T[K]>>;
} {
  return Object.fromEntries(
    Object.entries(shape).map(([key, schema]) => [
      key,
      (schema as z.ZodTypeAny).array().optional(),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
}

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

export const baseBlockSchema = prismaBlockSchema.merge(
  blockAllComputedFieldsSchema
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
      url: z.string().url().optional(),
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
  }).extend({ category: dbCategorySchema }),
});

export type PrismaTransaction = z.infer<typeof prismaTransactionSchema>;

export const prismaTransactionBlob = BlobsOnTransactionsModel.extend({
  blob: prismaBlobSchema,
});
export const prismaBlobOnTransactionSchema = BlobsOnTransactionsModel;

export const baseTransactionSchema = prismaTransactionSchema
  .omit({
    fromId: true,
    toId: true,
    gasPrice: true,
  })
  .merge(transactionAllComputedFieldsSchema)
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
