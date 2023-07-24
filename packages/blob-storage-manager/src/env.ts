import { z } from "zod";

function booleanTransformer(varName: string) {
  return (arg: string, ctx: z.RefinementCtx): boolean => {
    if (arg !== "true" && arg !== "false") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${varName} must be either true or false`,
      });

      return z.NEVER;
    }

    return arg === "true";
  };
}

const envSchema = z.object({
  BEE_DEBUG_ENDPOINT: z.string().url().optional(),
  BEE_ENDPOINT: z.string().url().optional(),
  CHAIN_ID: z
    .string()
    .min(1)
    .default("7011893055")
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
  GOOGLE_STORAGE_BUCKET_NAME: z.string().default("blobscan-test-bucket"),
  GOOGLE_STORAGE_PROJECT_ID: z.string().optional(),
  GOOGLE_SERVICE_KEY: z.string().optional(),
  GOOGLE_STORAGE_API_ENDPOINT: z.string().url().optional(),

  GOOGLE_STORAGE_ENABLED: z
    .string()
    .default("false")
    .transform(booleanTransformer("GOOGLE_STORAGE_ENABLED")),
  PRISMA_STORAGE_ENABLED: z
    .string()
    .default("false")
    .transform(booleanTransformer("PRISMA_STORAGE_ENABLED")),
  SWARM_STORAGE_ENABLED: z
    .string()
    .default("false")
    .transform(booleanTransformer("SWARM_STORAGE_ENABLED")),
});

export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;
