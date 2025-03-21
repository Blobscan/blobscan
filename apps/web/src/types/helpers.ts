export type MakeFieldRequired<T, K extends keyof T> = Omit<T, K> &
  Required<{
    [P in K]: T[P] extends Array<infer U> ? Required<U>[] : Required<T[P]>;
  }>;

export type Arrayified<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K][];
};

export type Stringified<T> = T extends Date | bigint
  ? string
  : T extends Array<infer U>
  ? Array<Stringified<U>>
  : T extends object
  ? { [K in keyof T]: Stringified<T[K]> }
  : T;

export type EChartCompliant<T extends Record<string, unknown>> = Stringified<T>;
