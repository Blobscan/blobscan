export type MakeRequired<T, K extends keyof T> = Omit<T, K> &
  Required<{
    [P in K]: T[P] extends Array<infer U> ? Required<U>[] : Required<T[P]>;
  }>;

export type Stringified<T> = T extends Array<infer U>
  ? Array<Stringified<U>>
  : T extends Date | bigint
  ? string
  : T extends object
  ? { [K in keyof T]: Stringified<T[K]> }
  : T;
