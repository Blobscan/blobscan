const PORT = process.env.BLOBSCAN_API_PORT;

if (!PORT) {
  throw new Error("BLOBSCAN_API_PORT is not set");
}

export { PORT };
