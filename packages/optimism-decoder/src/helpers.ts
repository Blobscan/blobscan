import axios from "axios";
import fs from "fs";
import path from "path";

import type { OptimismDecodedData } from "./decoder";

/**
 * Read the binary file and split it into chunks of the specified size.
 * @param buffer - The binary data from the file.
 * @param chunkSize - The size of each chunk.
 * @returns An array of chunks.
 */
export function chunks(buffer: Uint8Array, chunkSize: number): Uint8Array[] {
  const result = new Array(Math.ceil(buffer.length / chunkSize));
  for (let i = 0; i < buffer.length; i += chunkSize) {
    result[i / chunkSize] = buffer.slice(i, i + chunkSize);
  }
  return result;
}

/**
 * Convert the byte array to a number.
 * @param bytes - The array of bytes to convert.
 * @returns The number representation of the bytes.
 */
export function bytesToNumber(bytes: Uint8Array): number {
  return bytes.reduce(
    (acc, byte, index) => acc + (byte << (8 * (bytes.length - index - 1))),
    0
  );
}

type FetchResult = {
  versionedHashes: string[];
  blockNumber: number;
};

/**
 * Function to fetch data from Transactions API endpoint and extract versionedHash values.
 * @param transactionId - The transaction id.
 * @returns An array of versionedHash values.
 */
export async function fetchAndExtractVersionedHashes(
  transactionId: string
): Promise<FetchResult> {
  const endpoint = `https://api.blobscan.com/transactions/${transactionId}`;
  try {
    const response = await axios.get(endpoint);
    const data = response.data;

    const blockNumber: number = data.blockNumber;

    // Extract the versionedHash values from the blobs array
    const versionedHashes: string[] = data.blobs.map(
      (blob: { versionedHash: string }) => blob.versionedHash
    );

    console.log(`[${data.blockTimestamp}] Block: ${blockNumber}`);
    return {
      versionedHashes,
      blockNumber,
    };
  } catch (error) {
    console.error("Error fetching or processing data:", error);
    return { versionedHashes: [], blockNumber: 0 };
  }
}

/**
 * Function to download data from multiple endpoints based on the versionedHash list and save it to disk.
 * @param hashes - The list of versionedHash values.
 */
export async function downloadAndSaveFiles(
  blockNumber: number,
  transactionId: string,
  hashes: string[]
): Promise<string> {
  const targetFolder = path.join(__dirname, "blobs", "tx", transactionId);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
    console.log(`Directory created: ${targetFolder}`);
  }

  const filePaths: string[] = [];

  let index = 0;
  for (const hash of hashes) {
    const url = `https://api.blobscan.com/blobs/${hash}`;
    try {
      const response = await axios.get(url);
      const blobHexData = response.data.data;
      const buffer = Buffer.from(blobHexData.slice(2), "hex"); // Remove the "0x" prefix before converting

      const fileName = `${index}.bin`;
      const filePath = path.join(targetFolder, fileName);

      fs.writeFileSync(filePath, buffer);
      filePaths.push(filePath);
      index++;
    } catch (error) {
      console.error(`Failed to download data for ${hash}:`, error);
    }
  }
  const filename = combineFiles(blockNumber, transactionId, filePaths);
  return filename;
}

/**
 * Function to combine multiple binary files into a single file.
 * @param filePaths - Array of file paths to combine.
 */
function combineFiles(
  blockNumber: number,
  transactionId: string,
  filePaths: string[]
): string {
  const outputDir = path.join(__dirname, "blobs", "tx", transactionId);
  const outputFilePath = path.join(outputDir, `final_${blockNumber}.bin`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Directory created: ${outputDir}`);
  }

  const fileDescriptor = fs.openSync(outputFilePath, "w");

  try {
    for (const filePath of filePaths) {
      const fileBuffer = fs.readFileSync(filePath);
      fs.writeSync(fileDescriptor, fileBuffer);
    }
  } catch (error) {
    const error_ = error as Error;

    console.error("Error combining files:", error_.message);
  } finally {
    fs.closeSync(fileDescriptor);
  }

  return outputFilePath;
}

/**
 * Function to save OptimismDecodedData to a JSON file (decoded.json).
 * @param data - The OptimismDecodedData object to save.
 * @param transactionId - The transaction id to include in the filename.
 */
export function saveOptimismDecodedData(
  data: OptimismDecodedData,
  transactionId: string
): void {
  const outputDir = path.join(__dirname, "blobs", "tx", transactionId);
  const outputFilePath = path.join(outputDir, "decoded.json");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Directory created: ${outputDir}`);
  }

  const jsonData = JSON.stringify(data, null, 2);

  fs.writeFileSync(outputFilePath, jsonData, "utf8");
  console.log(`OptimismDecodedData saved to ${outputFilePath}`);
}
