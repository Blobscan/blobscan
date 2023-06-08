import { z } from "zod";

import { t } from "../client";

export const TIME_FRAME_SCHEMA = z.enum([
  "1d",
  "7d",
  "30d",
  "180d",
  "360d",
  "All",
]);
export type TimeFrame = z.infer<typeof TIME_FRAME_SCHEMA>;

function substractDays(date: Date, days: number) {
  return new Date(new Date().setDate(date.getDate() - days));
}

function getTimeFrameIntervals(timeFrame: TimeFrame): {
  initial: Date;
  final: Date;
} {
  switch (timeFrame) {
    case "1d":
    case "7d":
    case "30d":
    case "360d":
    default: {
      const day = parseInt(timeFrame.split("d")[0] ?? "1d");
      const now = new Date();
      const final = substractDays(now, 1);

      if (day === 1) {
        return {
          initial: final,
          final,
        };
      }

      return {
        initial: substractDays(final, day),
        final,
      };
    }
  }
}

export const withTimeFrame = t.middleware(({ next, input }) => {
  const timeFrame = TIME_FRAME_SCHEMA.parse(input);

  return next({
    ctx: {
      timeFrame: getTimeFrameIntervals(timeFrame),
    },
  });
});
