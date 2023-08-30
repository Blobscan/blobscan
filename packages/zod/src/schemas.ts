import { z } from "zod";

function isUndefined(value: unknown): boolean {
  return typeof value === "undefined";
}

function isUnset(value: unknown): boolean {
  return (typeof value === "string" && !value.length) || isUndefined(value);
}

function defaultTransformer(defaultValue: unknown) {
  return (arg: unknown) => {
    return isUnset(arg) ? defaultValue : arg;
  };
}

export function makeOptional(zParser: z.ZodType, defaultValue?: unknown) {
  let schema: z.ZodType = zParser.optional();

  if (!isUndefined(defaultValue)) {
    /**
     * We use `transform` here instead of `default` to avoid type errors caused by our current
     * schema that expects a string when the default value might be a number or boolean.
     */
    schema = schema.transform(defaultTransformer(defaultValue));
  }

  let orSchema: z.ZodType = z.literal("");

  if (!isUndefined(defaultValue)) {
    orSchema = orSchema.transform(defaultTransformer(defaultValue));
  }

  return schema.or(orSchema);
}

export const booleanSchema = z
  .string()
  .refine((s) => s === "true" || s === "false")
  .transform((s) => s === "true");

export const toBigIntSchema = z.string().transform((value) => BigInt(value));

export const nodeEnvSchema = z.enum(["development", "test", "production"]);

export const portSchema = z
  .string()
  .transform((s) => parseInt(s, 10))
  .pipe(z.number().positive());
