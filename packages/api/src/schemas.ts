import {
  AddressModel,
  BlobDataStorageReferenceModel,
  BlobModel,
  BlobsOnTransactionsModel,
  BlockModel,
  DailyStatsModel as GeneratedDailyStatsModel,
  OverallStatsModel as GeneratedOverallStatsModel,
  TransactionModel,
} from "@blobscan/db/prisma/zod";
import { hexSchema } from "@blobscan/db/prisma/zod-utils";
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

export const prismaBlobSchema = BlobModel.omit({
  firstBlockNumber: true,
  insertedAt: true,
  updatedAt: true,
}).extend({
  data: z.string().optional(),
  dataStorageReferences: z.array(
    BlobDataStorageReferenceModel.pick({
      blobStorage: true,
      dataReference: true,
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

export const prismaBlobOnTransactionSchema = BlobsOnTransactionsModel.partial()
  .required({ blobHash: true })
  .extend({
    blob: prismaBlobSchema.omit({ versionedHash: true }).optional(),
    block: prismaBlockSchema
      .omit({
        hash: true,
        number: true,
        timestamp: true,
      })
      .optional(),
    transaction: prismaTransactionSchema
      .omit({
        hash: true,
        blockNumber: true,
        blockTimestamp: true,
        blockHash: true,
      })
      .extend({ block: prismaBlockSchema.pick({ blobGasPrice: true }) })
      .optional(),
  });

// Need to override the `totalBlobSize` field to be a string instead of a bigint
// as trpc-openapi swagger generator can't deserialize bigint
// See https://github.com/trpc/trpc-openapi/issues/264
export const OverallStatsModel = GeneratedOverallStatsModel.extend({
  totalBlobSize: z.string(),
});
export const DailyStatsModel = GeneratedDailyStatsModel.extend({
  totalBlobSize: z.string(),
});

export type PrismaBlob = z.input<typeof prismaBlobSchema>;

export type PrismaBlobOnTransaction = z.input<
  typeof prismaBlobOnTransactionSchema
>;
