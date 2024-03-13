export function capitalize(str: string): string {
  if (!str.length) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function pluralize(word: string, count: number) {
  return count === 1 ? word : `${word}s`;
}

export function hexStringToUtf8(hexString: string): string {
  const byteArray = hexString
    .match(/.{1,2}/g)
    ?.map((byte) => parseInt(byte, 16));

  if (!byteArray) {
    throw new Error("Invalid hexadecimal string");
  }

  const uint8Array = new Uint8Array(byteArray);
  const textDecoder = new TextDecoder("utf-8");
  const utf8String = textDecoder.decode(uint8Array);

  return utf8String;
}
