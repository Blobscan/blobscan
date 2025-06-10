import type { Stringified } from "~/types";

export function stringify<T>(v: T): Stringified<T> {
  if (v instanceof Date || typeof v === "bigint") {
    return v.toString() as Stringified<T>;
  }

  if (Array.isArray(v)) {
    return v.map((item) => stringify(item)) as Stringified<T>;
  }
  if (v && typeof v === "object") {
    const result = {} as Stringified<T>;

    for (const [key, value] of Object.entries(v)) {
      result[key as keyof Stringified<T>] = stringify(value);
    }
    return result;
  }

  return v as Stringified<T>;
}
