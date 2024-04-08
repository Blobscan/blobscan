import { decodeBlob, isDecodableRollup } from "@blobscan/blob-decoder";

import type { Rollup } from "./types";

addEventListener(
  "message",
  (event: MessageEvent<{ rollup: Rollup; blobData: string }>) => {
    const { rollup, blobData } = event.data;
    const normalizedRollup = rollup.toUpperCase();

    if (isDecodableRollup(normalizedRollup)) {
      decodeBlob(normalizedRollup, blobData).then((result) => {
        postMessage(result);
      });
    } else {
      postMessage(null);
    }
  }
);
