type WithTimestampFields<T> = {
  insertedAt: Date;
  updatedAt: Date;
} & T;

type WithoutTimestampFields<T> = Omit<T, "insertedAt" | "updatedAt">;

function hasTimestampFields<T extends Record<string, unknown>>(
  data: T
): data is WithTimestampFields<T> {
  return (
    data !== null &&
    typeof data === "object" &&
    ("insertedAt" in data || "updatedAt" in data)
  );
}

function removeTimestampFields<T extends Record<string, unknown>>(
  data: WithTimestampFields<T>
): WithoutTimestampFields<T> {
  const { insertedAt: _, updatedAt: __, ...filteredData } = data;

  return filteredData;
}

export function omitDBTimestampFields<T extends Record<string, unknown>>(
  data: T
): WithoutTimestampFields<T> {
  if (hasTimestampFields(data)) {
    return removeTimestampFields(data);
  }

  return data;
}
