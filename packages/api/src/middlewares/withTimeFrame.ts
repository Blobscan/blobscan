import { z } from "zod";

import dayjs from "@blobscan/dayjs";
import type { Network } from "@blobscan/network-blob-config";

import { t } from "../trpc-client";

export const TIME_FRAMES = [
  "1d",
  "7d",
  "15d",
  "30d",
  "90d",
  "180d",
  "365d",
  "All",
] as const;

export const timeFrameSchema = z.enum(TIME_FRAMES);

export type TimeFrame = z.infer<typeof timeFrameSchema>;
export type TimeInterval = {
  initial: dayjs.Dayjs;
  final: dayjs.Dayjs;
};

function getTimeFrameDatePeriod(
  network: Network,
  timeFrame: TimeFrame
): TimeInterval {
  const final = dayjs().subtract(1, "day").endOf("day");

  if (timeFrame === "All") {
    const initialTimestamp = network.forks[0].activationTimestamp;

    return {
      initial: dayjs.unix(initialTimestamp),
      final,
    };
  }

  const day = parseInt(timeFrame.split("d")[0] ?? "1d");

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
  timeFrame: timeFrameSchema,
});

export const withTimeFrame = t.middleware(
  ({ next, input, ctx: { network } }) => {
    const { timeFrame } = withTimeFrameSchema.parse(input);

    return next({
      ctx: {
        timeFrame: getTimeFrameDatePeriod(network, timeFrame),
      },
    });
  }
);
