export type MakeRequired<T, K extends keyof T> = Omit<T, K> &
  Required<{
    [P in K]: T[P] extends Array<infer U> ? Required<U>[] : Required<T[P]>;
  }>;

export type Chartable<T> = T extends Array<infer U>
  ? Array<Chartable<U>>
  : T extends Date | bigint
  ? string
  : T extends object
  ? { [K in keyof T]: Chartable<T[K]> }
  : T;

export type NullableElements<T> = T extends (infer U)[] ? (U | null)[] : never;
