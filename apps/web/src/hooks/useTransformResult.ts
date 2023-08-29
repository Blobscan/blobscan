import { useMemo } from "react";

type TRPCResult<TData> = { isLoading: boolean; data?: TData };
type TransformFn<TData, TTransformedData> = (
  rawResult: TRPCResult<TData>
) => TTransformedData;

export function useTransformResult<TData>(
  rawResult: TRPCResult<TData>
): TData | undefined;

export function useTransformResult<TData, TTransformedData>(
  rawResult: TRPCResult<TData>,
  transformFn: TransformFn<TData, TTransformedData>
): TTransformedData | undefined;

export function useTransformResult<TData, TTransformedData>(
  rawResult: TRPCResult<TData>,
  transformFn?: TransformFn<TData, TTransformedData>
): TData | TTransformedData | undefined {
  return useMemo(() => {
    if (rawResult.isLoading) {
      return;
    }

    if (!transformFn) {
      return rawResult.data;
    }

    return transformFn(rawResult);
  }, [rawResult, transformFn]);
}
