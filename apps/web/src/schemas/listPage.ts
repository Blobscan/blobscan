import { filterParamsSchema } from "./filters";
import { paginationParamsSchema } from "./pagination";
import { sortParamsSchema } from "./sort";

export const listPageParamsSchema = paginationParamsSchema
  .merge(sortParamsSchema)
  .merge(filterParamsSchema);
