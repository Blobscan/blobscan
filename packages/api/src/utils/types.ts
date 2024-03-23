export type MakeFieldsMandatory<T, Keys extends keyof T> = Pick<T, Keys> &
  Partial<Omit<T, Keys>>;

export type TypeOrEmpty<T> = T | Record<string, never>;
