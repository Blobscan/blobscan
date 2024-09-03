import type dayjs from "@blobscan/dayjs";

export type BlockNumberRange = {
  from: number;
  to: number;
};

export type TimestampFields = "insertedAt" | "updatedAt";

export type WithoutTimestampFields<T> = Omit<T, TimestampFields>;

export type RawDate = string | Date | dayjs.Dayjs;

export type RawDatePeriod = {
  from?: RawDate;
  to?: RawDate;
};

export type DatePeriod = {
  from?: string;
  to?: string;
};
