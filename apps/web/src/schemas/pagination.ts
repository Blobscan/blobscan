import { z } from "@blobscan/zod";

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZES = [10, 25, 50, 100] as const;

export const paginationParamsSchema = z.object({
  cursor: z.string().optional(),
  ps: z.coerce.number().catch(0).optional(),
  page: z.coerce.number().int().positive().catch(1).optional(),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

export function normalizePaginationParams(params?: PaginationParams | null) {
  const validSize =
    params?.ps === undefined || PAGE_SIZES.some((size) => size === params.ps);
  return {
    cursor: validSize ? params?.cursor : undefined,
    ps: validSize ? params?.ps ?? DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE,
    page: validSize ? params?.page ?? 1 : 1,
  };
}
