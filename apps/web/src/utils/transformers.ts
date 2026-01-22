import type { Chartable } from "~/types";

export function stringify<T>(v: T): Chartable<T> {
  if (v instanceof Date || typeof v === "bigint") {
    return v.toString() as Chartable<T>;
  }

  if (Array.isArray(v)) {
    return v.map((item) => stringify(item)) as Chartable<T>;
  }
  if (v && typeof v === "object") {
    const result = {} as Chartable<T>;

    for (const [key, value] of Object.entries(v)) {
      result[key as keyof Chartable<T>] = stringify(value);
    }
    return result;
  }

  return v as Chartable<T>;
}
