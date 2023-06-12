let BLOBSCAN_API_ENDPOINT = process.env.BLOBSCAN_API_ENDPOINT;

if (process.env.NODE_ENV === "development" && !BLOBSCAN_API_ENDPOINT) {
  BLOBSCAN_API_ENDPOINT = "http://localhost:3001";
}

if (!BLOBSCAN_API_ENDPOINT) {
  throw new Error("BLOBSCAN_API is not set");
}

export { BLOBSCAN_API_ENDPOINT };
