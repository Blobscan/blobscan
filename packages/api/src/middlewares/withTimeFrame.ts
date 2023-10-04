import { z } from "zod";

import dayjs from "@blobscan/dayjs";

import { t } from "../trpc-client";

export const TIME_FRAMES = z.enum([
  "1d",
  "7d",
  "15d",
  "30d",
  "180d",
  "360d",
  "All",
]);

export type TimeFrame = z.infer<typeof TIME_FRAMES>;

export const timeFrameSchema = z.object({
  timeFrame: TIME_FRAMES,
});

function getTimeFrameIntervals(timeFrame: TimeFrame): {
  initial: dayjs.Dayjs;
  final: dayjs.Dayjs;
} {
  switch (timeFrame) {
    case "1d":
    case "7d":
    case "15d":
    case "30d":
    case "360d":
    default: {
      const day = parseInt(timeFrame.split("d")[0] ?? "1d");
      const final = dayjs().subtract(1, "day").endOf("day");

      if (day === 1) {
        return {
          initial: final,
          final,
        };
      }

      return {
        initial: final.subtract(day, "day").startOf("day"),
        final,
      };
    }
  }
}

export const withTimeFrame = t.middleware(({ next, input }) => {
  const { timeFrame } = timeFrameSchema.parse(input);

  return next({
    ctx: {
      timeFrame: getTimeFrameIntervals(timeFrame),
    },
  });
});

export const timeFrameProcedure = t.procedure
  .input(timeFrameSchema)
  .use(withTimeFrame);
