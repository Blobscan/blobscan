import { z } from "zod";

// We use this workaround instead of z.coerce.boolean.default(false)
// because it considers as "true" any value different than "false"
// (including the empty string).
export const booleanSchema = z
  .string()
  .refine((s) => s === "true" || s === "false")
  .transform((s) => s === "true");
