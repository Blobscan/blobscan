import type { RouterOutputs } from "@blobscan/api";

import {
  buildAddressRoute,
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
} from "./routes";

type SearchOutput = RouterOutputs["search"]["byTerm"];

export function getRouteBySearchCategory(
  category: keyof SearchOutput,
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
