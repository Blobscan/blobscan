import { z } from "zod";

import { toDailyDatePeriod } from "@blobscan/dayjs";
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
  const hasAtLeastOneDate = Boolean(from || to);

  const datePeriod = hasAtLeastOneDate
    ? toDailyDatePeriod({
        from,
        to,
      })
    : undefined;

  return next({
    ctx: {
      datePeriod,
    },
  });
});

export const withDate = t.middleware(({ next, input }) => {
  const { day } = dateSchema.parse(input);
  const datePeriod: DatePeriod = toDailyDatePeriod({
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
