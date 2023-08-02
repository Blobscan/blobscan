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

export function booleanSchema() {
  const schema: z.ZodType = z.string();

  return schema.transform((arg, ctx): boolean => {
    const varName = ctx.path[0];
    const arg_ = arg.toLowerCase();

    if (arg_ !== "true" && arg_ !== "false") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${varName} must be either true or false`,
      });

      return z.NEVER;
    }

    return arg_ === "true";
  });
}

export function optionalStringSchema(
  zParser: z.ZodType,
  defaultValue?: unknown
) {
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

export function chainIdSchema() {
  return z
    .string()
    .min(1)
    .transform((value, ctx) => {
      const chainId = parseInt(value, 10);

      if (isNaN(chainId) || chainId <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `CHAIN_ID is invalid: ${chainId}`,
        });

        return z.NEVER;
      }

      return chainId;
    });
}

type EnvVarSpec<S extends z.ZodTypeAny = z.ZodTypeAny> = {
  default?: unknown;
  optional?: boolean;
  schema?: S;
};

type EnvSpec<T extends Record<string, EnvVarSpec>> = {
  [K in keyof T]?: T[K];
};

export function createEnvSchema<T extends Record<string, EnvVarSpec>>(
  envSpec: EnvSpec<T>
) {
  const envObj = Object.keys(envSpec).reduce((obj, key) => {
    const {
      default: defaultValue,
      optional = false,
      schema = z.string().trim(),
    } = envSpec[key] ?? {};

    return {
      ...obj,
      [key]:
        optional || !isUndefined(defaultValue)
          ? optionalStringSchema(schema, defaultValue)
          : schema,
    };
  }, {} as { [K in keyof T]: T[K]["schema"] extends z.ZodTypeAny ? T[K]["schema"] : z.ZodString });

  return z.object(
    envObj as {
      [K in keyof T]: T[K]["schema"] extends z.ZodTypeAny
        ? T[K]["schema"]
        : z.ZodString;
    }
  );
}
