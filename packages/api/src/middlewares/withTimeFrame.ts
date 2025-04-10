import { z } from "zod";

import dayjs from "@blobscan/dayjs";

import { t } from "../trpc-client";

export const TIME_FRAMES = z.enum([
  "1d",
  "7d",
  "15d",
  "30d",
  "90d",
  "180d",
  "365d",
  "All",
]);

export type TimeFrame = z.infer<typeof TIME_FRAMES>;
export type TimeInterval = {
  initial: dayjs.Dayjs;
  final: dayjs.Dayjs;
};

function getTimeFrameIntervals(timeFrame: TimeFrame): TimeInterval {
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

export const withTimeFrameSchema = z.object({
  timeFrame: TIME_FRAMES,
});

export const withTimeFrame = t.middleware(({ next, input }) => {
  const { timeFrame } = withTimeFrameSchema.parse(input);

  return next({
    ctx: {
      timeFrame: getTimeFrameIntervals(timeFrame),
    },
  });
});
