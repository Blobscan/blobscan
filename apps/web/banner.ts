export function printBanner() {
  console.log(" ____  _       _");
  console.log("| __ )| | ___ | |__  ___  ___ __ _ _ __");
  console.log("|  _ \\| |/ _ \\| '_ \\/ __|/ __/ _` | '_ \\");
  console.log("| |_) | | (_) | |_) \\__ \\ (_| (_| | | | |");
  console.log("|____/|_|\\___/|_.__/|___/\\___\\__,_|_| |_|");
  console.log("Blobscan Web App (EIP-4844 blob explorer) - blobscan.com");
  console.log("=======================================================\n");
  console.log(
    `Configuration: network=${process.env.PUBLIC_NETWORK_NAME} explorer=${
      process.env.PUBLIC_EXPLORER_BASE_URL
    } beaconExplorer=${
      process.env.PUBLIC_BEACON_BASE_URL
    } feedbackEnabled=${!!process.env
      .FEEDBACK_WEBHOOK_URL} tracesEnabled=${!!process.env
      .TRACES_ENABLED} sentryEnabled=${!!process.env.PUBLIC_SENTRY_DSN_WEB}`
  );
  console.log(
    `Blob storage manager configuration: gcs=${!!process.env
      .GOOGLE_STORAGE_BUCKET_NAME} s3=${!!process.env
      .S3_STORAGE_BUCKET_NAME} weavevm=${!!process.env
      .WEAVEVM_STORAGE_API_BASE_URL}`
  );
}
