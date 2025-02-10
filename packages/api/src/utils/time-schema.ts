import { z } from "zod";

const ONE_DAY = 1_000 * 60 * 60 * 24;

export const TIME = ["1d", "7d", "15d", "30d", "180d", "360d"] as const;
export type Time = (typeof TIME)[number];

const TimeEnum = z.enum(TIME).transform((time) => {
  const days = parseInt(time.replace("d", ""));
  return new Date(Date.now() - days * ONE_DAY);
});

export const timeSchema = z.object({
  timeFrame: TimeEnum,
});
