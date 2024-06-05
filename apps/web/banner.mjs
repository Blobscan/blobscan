function maskSensitiveData(sensitiveData) {
  return sensitiveData?.replace(/./g, "*");
}

export function printBanner() {
  console.log(" ____  _   _   _    ");
  console.log("|  _ \(_) | | | |___  ___ __ _ _ __    ");
  console.log("| | | | | | | | / __|/ __/ _` | '_ \ ");
  console.log("| |_| | | | | | \__ \ (_| (_| | | | |");
  console.log("|____/|_| |_| |_|___/\___\__,_|_| |_|");
  console.log("Dillscan Web App (EIP-4844 blob explorer) - dillscan.com");
  console.log("=======================================================\n");
  console.log(
    `Configuration: network=${process.env.NEXT_PUBLIC_NETWORK_NAME} explorer=${
      process.env.NEXT_PUBLIC_EXPLORER_BASE_URL
    } beaconExplorer=${
      process.env.NEXT_PUBLIC_BEACON_BASE_URL
    } feedbackEnabled=${!!process.env
      .FEEDBACK_WEBHOOK_URL} tracesEnabled=${!!process.env
      .TRACES_ENABLED} sentryEnabled=${!!process.env
      .NEXT_PUBLIC_SENTRY_DSN_WEB}`
  );
  console.log(
    `Blob storage manager configuration: chainId=${process.env.CHAIN_ID}, file_system=${process.env.FILE_SYSTEM_STORAGE_ENABLED} postgres=${process.env.POSTGRES_STORAGE_ENABLED}, gcs=${process.env.GOOGLE_STORAGE_ENABLED}, swarm=${process.env.SWARM_STORAGE_ENABLED}`
  );

  if (process.env.GOOGLE_STORAGE_ENABLED) {
    console.log(
      `GCS configuration: bucketName=${
        process.env.GOOGLE_STORAGE_BUCKET_NAME
      }, projectId=${maskSensitiveData(
        process.env.GOOGLE_STORAGE_PROJECT_ID
      )}, apiEndpoint=${process.env.GOOGLE_STORAGE_API_ENDPOINT}`
    );
  }

  if (process.env.SWARM_STORAGE_ENABLED) {
    console.log(
      `Swarm configuration: beeEndpoint=${process.env.BEE_ENDPOINT}, debugEndpoint=${process.env.BEE_DEBUG_ENDPOINT}`
    );
  }

  if (process.env.FILE_SYSTEM_STORAGE_ENABLED) {
    console.log(
      `File system configuration: blobDirPath=${process.env.FILE_SYSTEM_STORAGE_PATH}`
    );
  }
}
