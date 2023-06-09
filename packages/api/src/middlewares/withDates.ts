import { z } from "zod";

import { t } from "../client";

export const DATES_SCHEMA = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const withDates = t.middleware(({ next, input }) => {
  const { startDate, endDate } = DATES_SCHEMA.parse(input);

  return next({
    ctx: {
      dates: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    },
  });
});
