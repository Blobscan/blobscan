import { z } from "zod";

export const env = z
  .object({
    SECRET_KEY: z.string().default("supersecret"),
  })
  .parse(process.env);
