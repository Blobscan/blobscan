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
}
