export const NEW_BLOB_HASH =
  "0x0100eac880c712dba4346c88ab564fa1b79024106f78f732cca49d8a68e4c174";
export const NEW_BLOB_FILE_URI = `${process.env.CHAIN_ID}/${NEW_BLOB_HASH.slice(
  2,
  4
)}/${NEW_BLOB_HASH.slice(4, 6)}/${NEW_BLOB_HASH.slice(
  6,
  8
)}/${NEW_BLOB_HASH.slice(2)}.txt`;
export const NEW_BLOB_DATA = "mock-data";
export const RAW_DATA = Buffer.from("mock-data");
export const HEX_DATA = `0x${RAW_DATA.toString("hex")}`;
export const SWARM_REFERENCE = "mock-reference";
export const SWARM_BATCH_ID = "mock-batch-id";
