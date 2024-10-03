import { createObjectCsvWriter } from "csv-writer";
import * as fs from "fs";
import * as path from "path";

const outputFile = "ecotone_decoded_fields.csv";
const csvWriter = createObjectCsvWriter({
  path: outputFile,
  header: [
    { id: "hash", title: "hash" },
    { id: "decoded_fields", title: "decoded_fields" },
  ],
  //append: true,
});

const writeRecordToCsv = async (hash: string, decodedContent: string) => {
  await csvWriter.writeRecords([{ hash, decoded_fields: decodedContent }]);
};

const generateCsv = async (directory: string) => {
  let errors = 0;
  const subdirectories = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const txHash of subdirectories) {
    const decodedFilePath = path.join(directory, txHash, "decoded.json");

    if (fs.existsSync(decodedFilePath)) {
      const decodedContentRaw = fs.readFileSync(decodedFilePath, "utf-8");
      try {
        const decodedContent = JSON.stringify(JSON.parse(decodedContentRaw));
        await writeRecordToCsv(txHash, decodedContent);
      } catch (err) {
        console.error(`Error parsing JSON for transaction ${txHash}: ${err}`);
        errors += 1;
      }
    } else {
      errors += 1;
      console.error(`Could not find ${decodedFilePath}`);
    }
  }
  console.log("\n*****************************");
  console.log(`Written ${outputFile}`);
  if (errors > 0) {
    console.error(
      `Note: ${errors} errors found during generation. Review the logs before importing!`
    );
  }
  console.log("*****************************");
};

const args = process.argv.slice(2);
const basePath = args[0];

if (!basePath) {
  console.error("Error: Please provide a base path as a parameter.");
  process.exit(1);
}

generateCsv(basePath).catch((err) => console.error(`Error: ${err}`));
