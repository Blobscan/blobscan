import { promises as fs } from "fs";
import * as path from "path";

import { saveDecodedOptimismDataToDB } from "./db";
import type { OptimismDecodedData } from "./decoder";

const args = process.argv.slice(2);
const basePath = args[0];
let errors = 0;

if (!basePath) {
  console.error("Error: Please provide a base path as a parameter.");
  process.exit(1);
}

saveDecodedDataToDB(basePath).catch((err) => console.error(`Error: ${err}`));

/**
 * Save the decoded JSON data to the database.
 * @param basePath The base directory path to start searching.
 * @returns A promise that resolves when all the data has been saved to the database.
 * @example saveFilesToDB("/path/to/decoded-json-files");
 */
export async function saveDecodedDataToDB(basePath: string) {
  const decodedData = await getDecodedJSONFiles(basePath);
  let good = 0;
  for (const { hash, data } of decodedData) {
    try {
      await saveDecodedOptimismDataToDB({
        hash,
        data,
      });
      good += 1;
    } catch (err) {
      errors += 1;
      console.error(`${err}`);
    }
  }

  console.log("\n*****************************");
  console.log(`Saved decoded fields for ${good} transactions.`);
  if (errors > 0) {
    console.error(
      `Note: ${errors} errors found during the process. Review the logs!`
    );
  }
  console.log("*****************************");
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
      errors += 1;
      console.error(`${err}`);
    }
  }

  return results;
}
