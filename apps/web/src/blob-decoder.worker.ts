import { decodeBlob, isValidDecoder } from "@blobscan/blob-decoder";

type BlobDecoderEvent = {
  blobData?: string;
  decoder?: string;
};

addEventListener("message", (event: MessageEvent<BlobDecoderEvent>) => {
  (async () => {
    try {
      const { decoder, blobData } = event.data;

      if (!decoder) {
        throw new Error("No decoder provided");
      }

      if (!blobData) {
        throw new Error("No blob data provided");
      }

      if (!isValidDecoder(decoder)) {
        throw new Error(`${decoder} decoder is not supported`);
      }

      const decodedBlob = await decodeBlob(blobData, decoder);

      postMessage({ decodedBlob });
    } catch (err) {
      console.error(err);
      postMessage({ error: (err as Error).message });
    }
  })();
});
