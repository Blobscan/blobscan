export const CHAIN_ID = 7011893058;
export const BLOB_HASH =
  "0x0100eac880c712dba4346c88ab564fa1b79024106f78f732cca49d8a68e4c174";
export const FILE_URI = `${CHAIN_ID}/${BLOB_HASH.slice(2, 4)}/${BLOB_HASH.slice(
  4,
  6
)}/${BLOB_HASH.slice(6, 8)}/${BLOB_HASH.slice(2)}.txt`;
export const BLOB_DATA = "mock-data";
export const RAW_DATA = Buffer.from("mock-data");
export const HEX_DATA = `0x${RAW_DATA.toString("hex")}`;
export const SWARM_REFERENCE = "mock-reference";
export const SWARM_BATCH_ID = "mock-batch-id";
export const GOOGLE_STORAGE_CONFIG = {
  bucketName: "mock-bucket",
  projectId: "mock-project",
  serviceKey:
    "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiYmxvYnNjYW4tMzc5MjE4IiwKICAiY2xpZW50X2VtYWlsIjogImJsb2JzY2FuLXMzLXN0YWdpbmdAYmxvYnNjYW4tMzc5MjE4LmlhbS5nc2VydmljZWFjY291bnQuY29tIgp9Cg==",
  apiEndpoint: "http://localhost:5050",
};
export const SWARM_STORAGE_CONFIG = {
  beeDebugEndpoint: "http://localhost:1635",
  beeEndpoint: "http://localhost:1633",
};
