export type MakeFieldRequired<T, K extends keyof T> = Omit<T, K> &
  Required<{
    [P in K]: Required<T[P]>;
  }>;
