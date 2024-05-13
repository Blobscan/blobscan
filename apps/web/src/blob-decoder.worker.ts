import { decodeBlob, isValidDecoder } from "@blobscan/blob-decoder";

type BlobDecoderEvent = {
  blobData?: string;
  decoder?: string;
};

addEventListener("message", (event: MessageEvent<BlobDecoderEvent>) => {
  try {
    const { decoder, blobData } = event.data;

    if (!decoder) {
      throw new Error("No decoder provided");
    }

    if (!blobData) {
      throw new Error("No blob data provided");
    }

    if (isValidDecoder(decoder)) {
      decodeBlob(blobData, decoder).then((result) => {
        postMessage({ decodedBlob: result });
      });
    } else {
      throw new Error(`${decoder} decoder is not supported`);
    }
  } catch (err) {
    postMessage({ error: (err as Error).message });
  }
});
