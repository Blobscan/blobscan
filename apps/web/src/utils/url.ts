export function toUrlQuery<T extends Record<string, unknown>>(
  state: T
): { [K in keyof T]: string } {
  const query = {} as { [K in keyof T]: string };

  for (const key in state) {
    const value = state[key];

    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      query[key] = value.join(",");
    } else if (value instanceof Date) {
      query[key] = value.toISOString();
    } else {
      query[key] = String(value);
    }
  }

  return query;
}

export function toQueryParam(value: Array<unknown> | unknown): string {
  if (Array.isArray(value)) {
    return value.join(",");
  } else if (value instanceof Date) {
    return value.toISOString();
  } else {
    return String(value);
  }
}
