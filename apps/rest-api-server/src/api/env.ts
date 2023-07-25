import z from "zod";

export const env = z
  .object({
    BLOBSCAN_API_PORT: z
      .string()
      .min(1)
      .default("3001")
      .transform((value, ctx) => {
        const port = parseInt(value, 10);

        if (isNaN(port) || port <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "BLOBSCAN_API_PORT must be a number greater than 0",
          });

          return z.NEVER;
        }

        return port;
      }),
  })
  .parse(process.env);
