import type { SearchResult } from "~/types";
import {
  buildAddressRoute,
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
} from "./routes";

export function getRouteBySearchCategory(
  category: keyof SearchResult,
  id: string
): string {
  switch (category) {
    case "address":
      return buildAddressRoute(id);
    case "blob": {
      return buildBlobRoute(id);
    }
    case "block":
    case "slot":
      return buildBlockRoute(id);
    case "transaction":
      return buildTransactionRoute(id);
    default:
      throw new Error("Invalid search category");
  }
}
