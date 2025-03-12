import { z } from "@blobscan/zod";

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
