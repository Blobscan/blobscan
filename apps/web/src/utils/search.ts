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
      const [txHash, txIndex] = id.split("-");

      if (!txHash || !txIndex) {
        return "";
      }

      return buildBlobRoute(txHash, txIndex);
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
