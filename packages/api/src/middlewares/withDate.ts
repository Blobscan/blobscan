import { z } from "zod";

import dayjs from "@blobscan/dayjs";
import { normalizeDate } from "@blobscan/db";
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

  const datePeriod: DatePeriod | undefined = hasAtLeastOneDate && {
    from: from ? normalizeDate(from) : undefined,
    to: normalizeDate(to ?? dayjs()),
  };

  return next({
    ctx: {
      datePeriod,
    },
  });
});

export const withDate = t.middleware(({ next, input }) => {
  const { day } = dateSchema.parse(input);
  const datePeriod: DatePeriod = {
    from: normalizeDate(day, "startOf"),
    to: normalizeDate(day, "endOf"),
  };

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
