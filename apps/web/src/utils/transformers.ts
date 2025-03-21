import type { Arrayified, Stringified } from "~/types";

export function stringify<T>(v: T): Stringified<T> {
  if (v instanceof Date || typeof v === "bigint") {
    return v.toString() as Stringified<T>;
  }

  if (Array.isArray(v)) {
    return v.map((item) => stringify(item)) as Stringified<T>;
  }
  if (v && typeof v === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const [key, value] of Object.entries(v)) {
      result[key] = stringify(value);
    }
    return result;
  }

  return v as Stringified<T>;
}

export function arrayfy<T extends Record<string, unknown>>(
  arr: T[]
): Arrayified<T> {
  if (!Array.isArray(arr) || arr.length === 0) return {} as Arrayified<T>;

  return arr.reduce((acc, obj) => {
    Object.keys(obj).forEach((key: keyof T) => {
      if (!acc[key]) {
        acc[key as keyof T] = [];
      }
      acc[key].push(obj[key]);
    });
    return acc;
  }, {} as Arrayified<T>);
}
