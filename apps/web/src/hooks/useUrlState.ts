import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/compat/router";

import type { z } from "@blobscan/zod";

import { getISODate } from "~/utils";

function toUrlQuery<T extends Record<string, unknown>>(
  state: T
): { [K in keyof T]: string } {
  const query = {} as { [K in keyof T]: string };

  for (const key in state) {
    const value = state[key];

    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      query[key] = value.join(",");
    } else if (value instanceof Date) {
      query[key] = getISODate(value);
    } else {
      query[key] = String(value);
    }
  }

  return query;
}

export function useUrlState<T extends z.AnyZodObject>(
  schema: T
): {
  state: z.infer<T> | null;
  updateState: (updates: Partial<z.infer<T>>) => void;
  isReady: boolean;
} {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [state, setState] = useState<z.infer<T> | null>(null);

  useEffect(() => {
    if (!router || !router.isReady) return;

    const result = schema.safeParse(router.query);

    if (result.success) {
      setState(result.data);
      setIsReady(true);
    }
  }, [router, schema]);

  const updateState = useCallback(
    (updates: Partial<z.infer<T>>) => {
      if (!router) {
        return;
      }

      const currentState = schema.safeParse(router.query).success
        ? schema.parse(router.query)
        : {};

      const nextState = { ...currentState, ...updates };

      const query = toUrlQuery(nextState);

      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [router, schema]
  );

  return {
    state,
    updateState,
    isReady,
  };
}
