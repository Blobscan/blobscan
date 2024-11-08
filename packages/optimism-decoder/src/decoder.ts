import fs from "fs";
import path from "path";
import rlp from "rlp";

import {
  chunks,
  bytesToNumber,
  fetchAndExtractVersionedHashes,
  downloadAndSaveFiles,
  saveOptimismDecodedData,
} from "./helpers";
import { readVarint, readBytesAsHex, readBitlist } from "./reader";
import { extractFullChannel, decompressBatches } from "./utils";

export type OptimismDecodedData = {
  timestampSinceL2Genesis: number;
  lastL1OriginNumber: number;
  parentL2BlockHash: string;
  l1OriginBlockHash: string;
  numberOfL2Blocks: number;
  changedByL1Origin: number; // how many were changed by L1 origin
  totalTxs: number;
  contractCreationTxsNumber: number;
  // TODO: add support for the following values
  // https://github.com/Blobscan/blobscan/issues/255
  // legacyTxsNumber: number;
  // totalGasLimit: number;
  // protectedLegacyTxsNumber: number;
};

/**
 * Main function to read and process the binary file.
 * @param filename - The name of the file to read.
 * This must be a file concatenating all blobs by frame number.
 * @returns An object containing decoded fields.
 */
export async function decodeOptimismFile(
  filename: string
): Promise<OptimismDecodedData> {
  const blobs = fs.readFileSync(filename);
  const datas: Uint8Array[] = [];

  for (const blob of chunks(blobs, 131072)) {
    if (blob[1] !== 0) {
      throw new Error("Assertion failed: blob[1] must be 0");
    }
    const declaredLength = bytesToNumber(blob.slice(2, 5));
    let blobData = new Uint8Array();

    for (const chunk of chunks(blob, 128)) {
      // split into chunks of 128 bytes
      const byteA = chunk[32 * 0];
      const byteB = chunk[32 * 1];
      const byteC = chunk[32 * 2];
      const byteD = chunk[32 * 3];

      if (
        byteA === undefined ||
        byteB === undefined ||
        byteC === undefined ||
        byteD === undefined
      ) {
        throw new Error("Assertion failed: bytes must be defined");
      }

      if ((byteA | byteB | byteC | byteD) & 0b1100_0000) {
        throw new Error("Assertion failed: bytes must meet specific criteria");
      }

      const tailA = chunk.slice(32 * 0 + 1, 32 * 1);
      const tailB = chunk.slice(32 * 1 + 1, 32 * 2);
      const tailC = chunk.slice(32 * 2 + 1, 32 * 3);
      const tailD = chunk.slice(32 * 3 + 1, 32 * 4);

      const x = (byteA & 0b0011_1111) | ((byteB & 0b0011_0000) << 2);
      const y = (byteB & 0b0000_1111) | ((byteD & 0b0000_1111) << 4);
      const z = (byteC & 0b0011_1111) | ((byteD & 0b0011_0000) << 2);

      const result = new Uint8Array(4 * 31 + 3);
      result.set(tailA, 0);
      result[tailA.length] = x;
      result.set(tailB, tailA.length + 1);
      result[tailA.length + 1 + tailB.length] = y;
      result.set(tailC, tailA.length + 1 + tailB.length + 1);
      result[tailA.length + 1 + tailB.length + 1 + tailC.length] = z;
      result.set(tailD, tailA.length + 1 + tailB.length + 1 + tailC.length + 1);

      if (result.length !== 4 * 31 + 3)
        throw new Error("Assertion failed: length of result is incorrect");

      const newBlobData = new Uint8Array(blobData.length + result.length);
      newBlobData.set(blobData, 0);
      newBlobData.set(result, blobData.length);
      blobData = newBlobData;
    }

    datas.push(blobData.slice(4, declaredLength + 4));
  }

  const fullChannel = extractFullChannel(datas);

  const decompressed = await decompressBatches(fullChannel);
  const dataToDecode: Uint8Array = decompressed;
  const { data: decoded } = rlp.decode(dataToDecode, true);

  if (decoded[0] !== 1) {
    throw new Error("decoded value is not a span batch");
  }

  if (!(decoded instanceof Uint8Array)) {
    throw new Error("decode must be Uint8Array");
  }

  let currentOffset = 1;

  const timestampResult = readVarint(decoded, currentOffset);
  currentOffset = timestampResult.newOffset;

  const l1OriginNumberResult = readVarint(decoded, currentOffset);
  currentOffset = l1OriginNumberResult.newOffset;

  const parentL2BlockHashResult = readBytesAsHex(decoded, currentOffset, 20);
  currentOffset = parentL2BlockHashResult.newOffset;

  const l1OriginBlockHashResult = readBytesAsHex(decoded, currentOffset, 20);
  currentOffset = l1OriginBlockHashResult.newOffset;

  const l2BlocksNumberResult = readVarint(decoded, currentOffset);
  const l2BlocksNumber = l2BlocksNumberResult.value;
  currentOffset = l2BlocksNumberResult.newOffset;

  const originChangesResult = readBitlist(
    l2BlocksNumber,
    decoded,
    currentOffset
  );
  const originChangesCount = originChangesResult.bits.filter(
    (bit) => bit
  ).length;
  currentOffset = originChangesResult.newOffset;

  let totalTxs = 0;
  for (let i = 0; i < l2BlocksNumber; i++) {
    const txCountResult = readVarint(decoded, currentOffset);
    totalTxs += txCountResult.value;
    currentOffset = txCountResult.newOffset;
  }

  const contractCreationResult = readBitlist(totalTxs, decoded, currentOffset);
  const contractCreationTxsNumber = contractCreationResult.bits.filter(
    (bit) => bit
  ).length;
  currentOffset = contractCreationResult.newOffset;

  return {
    timestampSinceL2Genesis: timestampResult.value,
    lastL1OriginNumber: l1OriginNumberResult.value,
    parentL2BlockHash: parentL2BlockHashResult.hex,
    l1OriginBlockHash: l1OriginBlockHashResult.hex,
    numberOfL2Blocks: l2BlocksNumber,
    changedByL1Origin: originChangesCount,
    totalTxs: totalTxs,
    contractCreationTxsNumber: contractCreationTxsNumber,
  } as OptimismDecodedData;

  /*
    // Read y parity bits
    const yParityBitsResult = readBitlist(totalTxs, decoded, currentOffset)
    currentOffset = yParityBitsResult.newOffset

    // Read transaction signatures, to addresses, and other fields
    const txSigs = []
    const txTos = []
    for (let i = 0; i < totalTxs; i++) {
      const sigResult = readBytesAsHex(decoded, currentOffset, 64)
      txSigs.push(sigResult.hex)
      currentOffset = sigResult.newOffset

      const toResult = readBytesAsHex(decoded, currentOffset, 20)
      txTos.push(toResult.hex)
      currentOffset = toResult.newOffset
    }

    // Verify contract creation addresses
    const contractCreationCount = txTos.filter((to) => parseInt(to, 16) === 0).length
    console.assert(contractCreationCount === contractCreationTxsNumber, 'Contract creation transaction number mismatch')

    // Remaining data processing
    const remainingData = decoded.slice(currentOffset)
    let p = 0
    let legacyTxsNumber = 0
    const txDatas = []

    for (let i = 0; i < totalTxs; i++) {
      if (remainingData[p] === 1 || remainingData[p] === 2) {
        p++
      } else {
        legacyTxsNumber++
      }
      const txData = rlp.decode(remainingData.slice(p)) as any
      txDatas.push(txData)

      const consumedLength = rlp.codec.consumeLengthPrefix(remainingData.slice(p), 0)[2] as number
      p += consumedLength
    }

    console.log('legacy txs number:', legacyTxsNumber)

    // Calculate nonce values
    const txNonces = []
    for (let i = 0; i < totalTxs; i++) {
      const nonceResult = readVarint(decoded, currentOffset)
      txNonces.push(nonceResult.value)
      currentOffset = nonceResult.newOffset
    }

    // Calculate total gas
    let totalGasLimit = 0
    for (let i = 0; i < totalTxs; i++) {
      const gasLimitResult = readVarint(decoded, currentOffset)
      totalGasLimit += gasLimitResult.value
      currentOffset = gasLimitResult.newOffset
    }

    console.log('total gas limit in txs:', totalGasLimit)

    // Calculate protected legacy transactions
    const protectedLegacyTxsResult = readBitlist(legacyTxsNumber, decoded, currentOffset)
    const protectedLegacyTxsCount = protectedLegacyTxsResult.bits.filter((bit) => bit).length
    console.log('number of EIP-155 protected legacy txs:', protectedLegacyTxsCount)
    */
}

export async function decodeOptimismTransaction(
  transactionId: string
): Promise<OptimismDecodedData | null> {
  const { versionedHashes, blockNumber } = await fetchAndExtractVersionedHashes(
    transactionId
  );
  const outputDir = path.join(__dirname, "blobs", "tx", transactionId);
  const outputFilePath = path.join(outputDir, "decoded.json");
  if (fs.existsSync(outputFilePath)) {
    console.log(`File already exists: ${outputFilePath}`);
    return null;
  }

  // Download blobs belonging to the transaction and append them, creating a final file.
  const filename = await downloadAndSaveFiles(
    blockNumber,
    transactionId,
    versionedHashes
  );
  const jsonData = await decodeOptimismFile(filename);
  saveOptimismDecodedData(jsonData, transactionId);
  return jsonData;
}
