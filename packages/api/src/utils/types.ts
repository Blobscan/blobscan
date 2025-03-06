export type MakeFieldsMandatory<T, Keys extends keyof T> = Pick<T, Keys> &
  Partial<Omit<T, Keys>>;

export type TypeOrEmpty<T> = T | Record<string, never>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};
