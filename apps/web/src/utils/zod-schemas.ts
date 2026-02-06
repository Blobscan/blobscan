import { z } from "zod";

import { Category, Rollup } from "@blobscan/db/prisma/enums";

export const multiValueFieldSchema = z
  .string()
  .optional()
  .transform((values) =>
    values
      ?.split(",")
      .map((v) => v.trim())
      .filter((v) => !!v.length)
  );

const LOWERCASE_DB_CATEGORY_ENUM = Object.entries(Category).reduce(
  (acc, [key, value]) => {
    acc[key.toLowerCase() as Lowercase<keyof typeof Category>] =
      value.toLowerCase() as Lowercase<Category>;
    return acc;
  },
  {} as Record<Lowercase<keyof typeof Category>, Lowercase<Category>>
);

const LOWERCASE_ROLLUP_ENUM = Object.entries(Rollup).reduce(
  (acc, [key, value]) => {
    acc[key.toLowerCase() as Lowercase<keyof typeof Rollup>] =
      value.toLowerCase() as Lowercase<Rollup>;
    return acc;
  },
  {} as Record<Lowercase<keyof typeof Rollup>, Lowercase<Rollup>>
);

export const categorySchema = z.nativeEnum(LOWERCASE_DB_CATEGORY_ENUM);

export const rollupSchema = z.nativeEnum(LOWERCASE_ROLLUP_ENUM);

export function createMultiValueFieldSchema<TSchema extends z.ZodTypeAny>(
  valueSchema: TSchema
): z.ZodEffects<
  typeof multiValueFieldSchema,
  z.infer<TSchema>[] | undefined,
  z.input<typeof multiValueFieldSchema>
> {
  return multiValueFieldSchema.transform((values, ctx) => {
    if (!values) return undefined;

    const out: z.infer<TSchema>[] = [];

    for (const v of values) {
      const res = valueSchema.safeParse(v);

      if (!res.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: { value: v },
          message: `Provided value ${v} is invalid`,
        });

        continue;
      }

      out.push(res.data);
    }

    return out;
  });
}
