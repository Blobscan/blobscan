import stream from "stream";
import zlib from "zlib";

const MAX_BYTES_PER_CHANNEL = 10_000_000;

export const decompressBatches = async (
  compressedBatches: string
): Promise<Buffer> => {
  const inputBuffer = Buffer.from(compressedBatches, "hex");

  try {
    // Decompress the input buffer
    const decompress = zlib.createInflate({
      maxOutputLength: MAX_BYTES_PER_CHANNEL,
      finishFlush: zlib.constants.Z_SYNC_FLUSH, // required when decompressing span batches, otherwise "Error: unexpected end of file"
    });
    const decompressStream = stream.Readable.from(inputBuffer);

    const chunks: Buffer[] = [];
    for await (const chunk of decompressStream.pipe(decompress)) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (err) {
    console.error("Error in decompression:", err);
    throw err;
  }
};

/**
 * Function to process data and extract frames, decoding according to the provided logic.
 * @param datas - Array of Uint8Array data chunks to process.
 * @returns An array of frames with compressed data.
 */
export function extractFullChannel(datas: Uint8Array[]): string {
  const frames: string[] = [];

  for (let data of datas) {
    if (data[0] !== 0)
      throw new Error(
        "Assertion failed: data[0] must be 0 (derivation version)"
      );

    data = data.slice(1); // Strip prefix byte

    while (data.length > 0) {
      if (
        data[16] === undefined ||
        data[17] === undefined ||
        data[18] === undefined ||
        data[19] === undefined ||
        data[20] === undefined ||
        data[21] === undefined
      ) {
        throw new Error("Assertion failed: data must have at least 22 bytes");
      }

      const frameLength =
        (data[18] << 24) | (data[19] << 16) | (data[20] << 8) | data[21]; // Convert 4 bytes to an integer
      const end = 16 + 2 + 4 + frameLength + 1;
      const frameDataBytes = data.slice(16 + 2 + 4, end - 1);
      const frameData = Array.from(frameDataBytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      frames.push(frameData);

      data = data.slice(end); // Move to the next chunk of data
    }
  }

  return frames.join("");
}
