export type MakeFieldRequired<T, K extends keyof T> = Omit<T, K> &
  Required<{
    [P in K]: T[P] extends Array<infer U> ? Required<U>[] : Required<T[P]>;
  }>;
