import { promises as fs } from "fs";
import * as path from "path";

import { saveDecodedOptimismDataToDB } from "./db";
import type { OptimismDecodedData } from "./decoder";

/**
 * Save the decoded JSON data to the database.
 * @param basePath The base directory path to start searching.
 * @returns A promise that resolves when all the data has been saved to the database.
 * @example saveFilesToDB("/path/to/decoded-json-files");
 */
export async function saveFilesToDB(basePath: string) {
  const decodedData = await getDecodedJSONFiles(basePath);

  for (const { hash, data } of decodedData) {
    try {
      await saveDecodedOptimismDataToDB({
        hash,
        data,
      });
    } catch (err) {
      console.error(`Error saving decoded data to DB for hash ${hash}:`, err);
      console.error("Data:", data);
    }
  }
}

/**
 * Recursively get all decoded.json files in the directory.
 * @param basePath The base directory path to start searching.
 * @returns A promise that resolves to an array of objects containing the hash and the decoded.json files.
 */
async function getDecodedJSONFiles(
  basePath: string
): Promise<{ hash: string; data: OptimismDecodedData }[]> {
  const results: { hash: string; data: OptimismDecodedData }[] = [];
  const items = await fs.readdir(basePath, { withFileTypes: true });

  for (const item of items) {
    try {
      if (item.isDirectory()) {
        const hash = item.name;
        const filePath = path.join(basePath, hash, "decoded.json");
        const fileContent = await fs.readFile(filePath, "utf8");
        const data = JSON.parse(fileContent);
        results.push({ hash, data });
      }
    } catch (err) {
      console.error(`Error reading decoded.json file for ${item.name}:`, err);
    }
  }

  return results;
}
