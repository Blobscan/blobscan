import { z } from "zod";

export const DEFAULT_LIMIT = 50;

export const DEFAULT_OFFSET = 0;

export const PAGINATION_INPUTS = {
  p: z.number().optional(),
  ps: z.number().optional(),
};

export function getPaginationParams(input: { ps?: number; p?: number }): {
  skip: number;
  take: number;
} {
  const limit = input.ps ?? DEFAULT_LIMIT;
  const offset = input.p ?? 1;

  return {
    take: limit,
    skip: (offset - 1) * limit,
  };
}
