import type dayjs from "@blobscan/dayjs";

export type BlockNumberRange = {
  from: number;
  to: number;
};

export type TimestampFields = "insertedAt" | "updatedAt";

export type WithoutTimestampFields<T> = Omit<T, TimestampFields>;

export type DateLike = string | Date | dayjs.Dayjs;

export type DatePeriodLike = {
  from?: DateLike;
  to?: DateLike;
};

export type DatePeriod = {
  from?: Date;
  to?: Date;
};
