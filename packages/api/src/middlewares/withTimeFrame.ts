import type { Chain } from "@blobscan/chains";
import dayjs from "@blobscan/dayjs";
import { z } from "@blobscan/zod";

import type { TimeFrame } from "../time-frames";
import { getTimeFrameDays, timeFrameSchema } from "../time-frames";
import { t } from "../trpc-client";

export type TimeInterval = {
  initial: dayjs.Dayjs;
  final: dayjs.Dayjs;
};

function getTimeFrameDatePeriod(
  chain: Chain,
  timeFrame: TimeFrame
): TimeInterval {
  const final = dayjs().subtract(1, "day").endOf("day");

  if (timeFrame === "All") {
    const initialDate = chain.forks[0].activationDate;

    return {
      initial: dayjs(initialDate),
      final,
    };
  }

  const day = getTimeFrameDays(timeFrame);

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

export const withTimeFrame = t.middleware(({ next, input, ctx: { chain } }) => {
  const { timeFrame } = withTimeFrameSchema.parse(input);

  return next({
    ctx: {
      timeFrame: getTimeFrameDatePeriod(chain, timeFrame),
    },
  });
});
