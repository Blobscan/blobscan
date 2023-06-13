import dayjs from "dayjs";
import { z } from "zod";

import { t } from "../client";
import { normalizeDate, type DatePeriod } from "../utils/dates";

export const DATE_PERIOD_SCHEMA = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const DAILY_DATE_SCHEMA = z.object({
  day: z.coerce.date(),
});

export const withDatePeriod = t.middleware(({ next, input }) => {
  const { from, to } = DATE_PERIOD_SCHEMA.parse(input);
  const datePeriod: DatePeriod = {
    from: from ? normalizeDate(from) : undefined,
    to: normalizeDate(to ?? dayjs()),
  };

  return next({
    ctx: {
      datePeriod,
    },
  });
});

export const withDailyDate = t.middleware(({ next, input }) => {
  const { day } = DAILY_DATE_SCHEMA.parse(input);
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

export const dailyDateProcedure = t.procedure
  .input(DAILY_DATE_SCHEMA)
  .use(withDailyDate);
