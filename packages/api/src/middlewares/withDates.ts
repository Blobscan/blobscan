import dayjs from "dayjs";
import { z } from "zod";

import { t } from "../clients/trpc";
import { normalizeDate, type DatePeriod } from "../utils/dates";

export const DATE_PERIOD_SCHEMA = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .optional();

export const DATE_SCHEMA = z.object({
  day: z.coerce.date(),
});

export const withDatePeriod = t.middleware(({ next, input }) => {
  const { from, to } = DATE_PERIOD_SCHEMA.parse(input) || {};
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
  const { day } = DATE_SCHEMA.parse(input);
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
  .input(DATE_PERIOD_SCHEMA)
  .use(withDatePeriod);

export const dateProcedure = t.procedure.input(DATE_SCHEMA).use(withDate);
