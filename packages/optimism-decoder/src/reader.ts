/**
 * Reads a bit list from a Uint8Array.
 * @param length - The number of bits to read.
 * @param buffer - The Uint8Array containing the data.
 * @param offset - The starting offset.
 * @returns An object containing the list of bits and the new offset.
 */
export function readBitlist(
  length: number,
  buffer: Uint8Array,
  offset: number
): { bits: boolean[]; newOffset: number } {
  const bits: boolean[] = [];
  let currentOffset = offset;

  while (length > 0 && currentOffset < buffer.length) {
    const byte = buffer[currentOffset++];

    if (byte === undefined) {
      throw new Error("Assertion failed: byte must be defined");
    }

    const tempBits: boolean[] = [];

    for (let i = 0; i < Math.min(8, length); i++) {
      tempBits.push(((byte >> i) & 1) === 1);
    }

    bits.push(...tempBits.reverse());
    length -= 8;
  }

  return { bits, newOffset: currentOffset };
}

/**
 * Function to read a variable-length integer (varint) from a Uint8Array.
 * @param buffer - The input Uint8Array containing the varint.
 * @param offset - The offset at which to start reading.
 * @returns An object containing the decoded varint and the new offset.
 */
export function readVarint(
  buffer: Uint8Array,
  offset: number
): { value: number; newOffset: number } {
  let result = 0;
  let shift = 0;
  let currentOffset = offset;

  while (currentOffset < buffer.length) {
    const byte = buffer[currentOffset++];

    if (byte === undefined) {
      throw new Error("Assertion failed: byte must be defined");
    }

    result |= (byte & 0b01111111) << shift;
    if ((byte & 0b10000000) === 0) {
      break; // Stop if the most significant bit is 0
    }
    shift += 7;
  }

  return { value: result, newOffset: currentOffset };
}

/**
 * Function to read a specific number of bytes from a Uint8Array.
 * @param buffer - The input Uint8Array.
 * @param offset - The offset at which to start reading.
 * @param length - The number of bytes to read.
 * @returns An object containing the read bytes as a hex string and the new offset.
 */
export function readBytesAsHex(
  buffer: Uint8Array,
  offset: number,
  length: number
): { hex: string; newOffset: number } {
  const bytes = buffer.slice(offset, offset + length);
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return { hex, newOffset: offset + length };
}
