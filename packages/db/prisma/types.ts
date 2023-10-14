export type BlockNumberRange = {
  from: number;
  to: number;
};

export type TimestampFields = "insertedAt" | "updatedAt";

export type WithoutTimestampFields<T> = Omit<T, TimestampFields>;
