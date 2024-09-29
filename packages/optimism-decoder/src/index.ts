import { decodeOptimismFile } from "./decoder";

export { decodeOptimismFile } from "./decoder";

const args = process.argv.slice(2);
const filename = args[0];

if (!filename) {
  console.error("Error: Please provide a filename as a parameter.");
  console.error(
    "Usage: npm run op:decode packages/optimism-decoder/opstack_blobs_19538908.bin"
  );
  process.exit(1);
}

decodeOptimismFile(filename).then((data) => {
  console.log("Timestamp since L2 genesis:", data.timestampSinceL2Genesis);
  console.log("Last L1 origin number:", data.lastL1OriginNumber);
  console.log("Parent L2 block hash:", data.parentL2BlockHash);
  console.log("L1 origin block hash:", data.l1OriginBlockHash);
  console.log("Number of L2 blocks:", data.numberOfL2Blocks);
  console.log("How many were changed by L1 origin:", data.changedByL1Origin);
  console.log("Total txs:", data.totalTxs);
  console.log("Contract creation txs number:", data.contractCreationTxsNumber);
  // There are more fields that can be decoded. However this commented out implementation is not working.
  // https://github.com/Blobscan/blobscan/issues/255
  /*
    console.log("Legacy txs number:", data.legacyTxsNumber);
    console.log("Total gas limit in txs:", data.totalGasLimit);
    console.log(
      "Number of EIP-155 protected legacy txs:",
      data.protectedLegacyTxsNumber
    );
    */
});
