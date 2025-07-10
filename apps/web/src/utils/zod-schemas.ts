import { z } from "zod";

import { Category, Rollup } from "@blobscan/db/prisma/enums";

export const commaSeparatedValuesSchema = z
  .string()
  .optional()
  .transform((values) =>
    values
      ?.split(",")
      .map((v) => v.trim())
      .filter((v) => !!v.length)
  );

export const commaSeparatedRollupsSchema = commaSeparatedValuesSchema.transform(
  (values, ctx) =>
    values?.map((v) => {
      const res = rollupSchema.safeParse(v);

      if (!res.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: {
            value: v,
          },
          message: "Provided rollup value is invalid",
        });

        return z.NEVER;
      }

      return res.data;
    })
);

export const commaSeparatedCategoriesSchema =
  commaSeparatedValuesSchema.transform((values, ctx) =>
    values?.map((v) => {
      const res = categorySchema.safeParse(v);

      if (!res.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: {
            value: v,
          },
          message: "Provided category value is invalid",
        });

        return z.NEVER;
      }

      return res.data;
    })
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
