import dayjs from "dayjs";
import { z } from "zod";

import { t } from "../client";

export const TIME_FRAME_ENUM = z.enum([
  "1d",
  "7d",
  "30d",
  "180d",
  "360d",
  "All",
]);

export const TIME_FRAME_SCHEMA = z.object({
  timeFrame: TIME_FRAME_ENUM,
});

export type TimeFrame = z.infer<typeof TIME_FRAME_ENUM>;

function getTimeFrameIntervals(timeFrame: TimeFrame): {
  initial: dayjs.Dayjs;
  final: dayjs.Dayjs;
} {
  switch (timeFrame) {
    case "1d":
    case "7d":
    case "30d":
    case "360d":
    default: {
      const day = parseInt(timeFrame.split("d")[0] ?? "1d");
      const final = dayjs().subtract(day, "day");

      if (day === 1) {
        return {
          initial: final,
          final,
        };
      }

      return {
        initial: final.subtract(day, "day"),
        final,
      };
    }
  }
}

export const withTimeFrame = t.middleware(({ next, input }) => {
  const { timeFrame } = TIME_FRAME_SCHEMA.parse(input);

  return next({
    ctx: {
      timeFrame: getTimeFrameIntervals(timeFrame),
    },
  });
});

export const timeFrameProcedure = t.procedure
  .input(TIME_FRAME_SCHEMA)
  .use(withTimeFrame);
