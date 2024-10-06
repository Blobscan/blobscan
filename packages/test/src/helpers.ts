import type { Category, Rollup } from "@prisma/client";

type CategorRollupElement = {
  category?: Category | null;
  rollup?: Rollup | null;
};

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

export function sortByCategoryRollup(
  a: CategorRollupElement,
  b: CategorRollupElement
) {
  const aIsTotal = a.category === null && a.rollup === null;
  const bIsTotal = b.category === null && b.rollup === null;

  if (aIsTotal) {
    return -1;
  }

  if (bIsTotal) {
    return 1;
  }

  if (a.category || b.category) {
    if (a.category && b.category) {
      return a.category.localeCompare(b.category);
    } else if (a.category) {
      return -1;
    } else {
      return 1;
    }
  }

  if (a.rollup || b.rollup) {
    if (a.rollup && b.rollup) {
      return a.rollup.localeCompare(b.rollup);
    } else if (a.rollup) {
      return -1;
    } else {
      return 1;
    }
  }

  return 0;
}
