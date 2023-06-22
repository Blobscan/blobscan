import { useMemo } from "react";

type TransformFn<T, R> = (rawResult: { isLoading: boolean; data?: T }) => R;

export function useTransformResult<T, R>(
  rawResult: { isLoading: boolean; data?: T },
  transformFn: TransformFn<T, R>,
): R {
  return useMemo(() => transformFn(rawResult), [rawResult, transformFn]);
}
