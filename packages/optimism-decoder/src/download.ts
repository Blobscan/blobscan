/*
  This script run Optimism transactions from block 19429617 (Mar-13-2024 11:58:59 PM +UTC) to block 20277188 (Jul-10-2024 04:03:47 PM +UTC)

  Extract list of Optimism txs between block 19429617 and 20277188
  $ psql $POSTGRES_URI -c "SELECT hash FROM transaction WHERE from_id = '0x6887246668a3b87f54deb3b94ba47a6f63f32985' AND block_number BETWEEN 19429617 AND 20277188 ORDER BY block_number;" > optimism_ecotone.txt
 
  First Ecotone tx in block 19429617 (Mar 14, 2024 1:12 AM+01:00):
  https://staging.blobscan.com/tx/0xa3e36193ab5ca4e6e98848640b1896def4c419ce203e7bd8e876dd2d5eb77e6c

  Last Ecotone tx in block 20277188 (Jul 10, 2024 6:07 PM+02:00)
  https://staging.blobscan.com/0x540f9dcc8d334a8c45dd9b307441686770dc924778fd3f64a1a2b325844f4968

  Previous to Ecotone, data was sent in calldata. Ecotone added support for EIP-4844 and blobs
  
  Pre-Ecotone tx https://staging.blobscan.com/0x74ea2491e57101a18c0aca40983e5d2e00aca3f3e6c38bb5d93fa740195332f3
  Post-Ecotone tx (not working):  https://staging.blobscan.com/tx/0xce04f9a100534bcf6c74c0f322ddc628d09ad927670110d3fe851816cba90c8e

  Usage: provide a file with one transaction id per line, or list of transaction ids
    npx ts-node src/download.ts optimism_ecotone.txt
    npx ts-node src/download.ts 0x74ea2491e57101a18c0aca40983e5d2e00aca3f3e6c38bb5d93fa740195332f3 [...]
*/
import fs from "fs";
import path from "path";

// TODO: fix this import and move to the scripts/ folder
//import { decodeOptimismTransaction } from "@blobscan/optimism-decoder";
import { decodeOptimismTransaction } from "./decoder";

function logInfo(message: string): void {
  const errorLogPath = path.join(__dirname, "info.log");
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(errorLogPath, logMessage, "utf8");
}

async function main(transactionIds: string[]) {
  for (const txId of transactionIds) {
    try {
      const jsonData = await decodeOptimismTransaction(txId);
      if (jsonData == null) {
        console.log(`Skipped: ${txId}`);
      } else {
        console.log(jsonData);
        const message = `Sucesss: ${txId}`;
        console.log(message);
        logInfo(message);
      }
    } catch (error) {
      const error_ = error as Error;

      console.log(error_.message);
      logInfo(`Failure: ${txId}`);
      logInfo(error_.message);
    }
  }
}

/**
 * Read transaction IDs from a file.
 * @param filePath - The path to the file containing transaction IDs.
 * @returns An array of transaction IDs.
 */
function readTransactionIdsFromFile(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  return content
    .split("\n")
    .map((id) => id.trim())
    .filter(Boolean);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Error: No transaction IDs or file path provided.");
  process.exit(1);
}

let transactionIds: string[] = [];

const filename = args[0] || "";
if (filename.startsWith("0x")) {
  transactionIds = args;
} else {
  transactionIds = readTransactionIdsFromFile(filename);
}

main(transactionIds);
