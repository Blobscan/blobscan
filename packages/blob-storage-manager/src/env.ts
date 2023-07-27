import { z } from "zod";

function transformToBoolean(varName: string) {
  return (arg: string, ctx: z.RefinementCtx): boolean => {
    const arg_ = arg.toLowerCase();
    if (arg_ !== "true" && arg_ !== "false") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${varName} must be either true or false`,
      });

      return z.NEVER;
    }

    return arg_ === "true";
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
  GOOGLE_STORAGE_BUCKET_NAME: z.string().optional(),
  GOOGLE_STORAGE_PROJECT_ID: z.string().optional(),
  GOOGLE_SERVICE_KEY: z.string().optional(),
  GOOGLE_STORAGE_API_ENDPOINT: z.string().url().optional(),

  GOOGLE_STORAGE_ENABLED: z
    .string()
    .default("false")
    .transform(transformToBoolean("GOOGLE_STORAGE_ENABLED")),
  POSTGRES_STORAGE_ENABLED: z
    .string()
    .default("false")
    .transform(transformToBoolean("POSTGRES_STORAGE_ENABLED")),
  SWARM_STORAGE_ENABLED: z
    .string()
    .default("false")
    .transform(transformToBoolean("SWARM_STORAGE_ENABLED")),
});

export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;
