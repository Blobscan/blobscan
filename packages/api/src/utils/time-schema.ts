import { z } from "zod";

const ONE_DAY = 1_000 * 60 * 60 * 24;

export const TIME = ["1d", "7d", "15d", "30d", "180d", "360d", "All"] as const;
export type Time = (typeof TIME)[number];

const TimeEnum = z.enum(TIME).transform((time) => {
  if (time === "All") {
    return undefined;
  }

  const today = Math.floor(Date.now() / ONE_DAY) * ONE_DAY;
  const days = parseInt(time.replace("d", ""));

  return {
    initial: new Date(today - days * ONE_DAY),
    final: new Date(today),
  };
});

export const timeSchema = z.object({
  timeFrame: TimeEnum,
});
