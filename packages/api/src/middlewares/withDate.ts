import { z } from "zod";

import { normalizeDailyDatePeriod } from "@blobscan/db";
import type { DatePeriod } from "@blobscan/db";

import { t } from "../trpc-client";

export const datePeriodSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .optional();

export const dateSchema = z.object({
  day: z.coerce.date(),
});

export const withDatePeriod = t.middleware(({ next, input }) => {
  const { from, to } = datePeriodSchema.parse(input) || {};
  const hasAtLeastOneDate = from || to;

  const datePeriod =
    hasAtLeastOneDate &&
    normalizeDailyDatePeriod({
      from,
      to,
    });

  return next({
    ctx: {
      datePeriod,
    },
  });
});

export const withDate = t.middleware(({ next, input }) => {
  const { day } = dateSchema.parse(input);
  const datePeriod: DatePeriod = normalizeDailyDatePeriod({
    to: day,
    from: day,
  });

  return next({
    ctx: {
      datePeriod,
    },
  });
});

export const datePeriodProcedure = t.procedure
  .input(datePeriodSchema)
  .use(withDatePeriod);

export const dateProcedure = t.procedure.input(dateSchema).use(withDate);
