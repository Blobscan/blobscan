import { z } from "zod";

export const env = z
  .object({
    BEE_DEBUG_ENDPOINT: z.string().url(),
    BEE_ENDPOINT: z.string().url(),
    CHAIN_ID: z
      .string()
      .min(1)
      .transform((value, ctx) => {
        const chainId = parseInt(value, 10);

        if (isNaN(chainId) || chainId <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "CHAIN_ID must be a number greater than 0",
          });

          return z.NEVER;
        }

        return chainId;
      }),
    GOOGLE_STORAGE_BUCKET_NAME: z.string().default("blobscan-storage"),
    GOOGLE_STORAGE_PROJECT_ID: z.string().optional(),
    GOOGLE_SERVICE_KEY: z.string().optional(),
    SECRET_KEY: z.string().default("supersecret"),
  })
  .parse(process.env);
